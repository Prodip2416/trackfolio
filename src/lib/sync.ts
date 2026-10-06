import prisma from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'
import { recalculateStockAggregates } from '@/lib/stock-aggregates'

const DSE_PRICES_URL = 'https://www.dse.com.bd/api/live/prices'
const FETCH_TIMEOUT_MS = 10_000
// Prices are shared across users, so skip a sync if one just ran
const MIN_SYNC_INTERVAL_MS = 60_000
const UPDATE_BATCH_SIZE = 200

async function fetchDsePrices(retries = 1): Promise<Response> {
  try {
    const res = await fetch(DSE_PRICES_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    })
    if (!res.ok) throw new Error(`DSE price API returned ${res.status}`)
    return res
  } catch (error) {
    if (retries > 0) return fetchDsePrices(retries - 1)
    throw error
  }
}

export async function syncDseData(userId: string) {
  const skipped = !(await syncPrices())

  // Keep this user's stored aggregates in sync with the current calculation logic.
  // Sequential to stay within the small DB pool.
  const userStocks = await prisma.stocks.findMany({
    where: { user_id: userId },
    select: { id: true }
  })
  for (const stock of userStocks) {
    await recalculateStockAggregates(stock.id)
  }

  return { success: true, skipped }
}

// Returns false when skipped because another sync ran recently
async function syncPrices() {
  const latest = await prisma.dse_companies.aggregate({ _max: { updated_at: true } })
  const lastSync = latest._max.updated_at?.getTime() ?? 0
  if (Date.now() - lastSync < MIN_SYNC_INTERVAL_MS) {
    return false
  }

  console.log('Fetching live prices from DSE...')
  const priceResponse = await fetchDsePrices()

  const { cols, rows }: { cols: string[]; rows: any[][] } = await priceResponse.json()
  const codeIdx = cols.indexOf('code')
  const ltpIdx = cols.indexOf('ltp')
  const ycpIdx = cols.indexOf('ycp')

  if (codeIdx === -1 || ltpIdx === -1) {
    throw new Error('DSE price API response format has changed')
  }

  // 1. Build a symbol -> price map from the live feed
  const priceMap = new Map<string, number>()
  for (const row of rows) {
    const symbol = String(row[codeIdx] ?? '').trim().toUpperCase()
    // Fall back to previous close when the market hasn't traded this symbol yet (ltp == 0)
    const ltp = Number(row[ltpIdx])
    const price = ltp > 0 ? ltp : (ycpIdx !== -1 ? Number(row[ycpIdx]) : NaN)
    // Never overwrite a known price with 0/invalid data
    if (symbol && Number.isFinite(price) && price > 0) {
      priceMap.set(symbol, price)
    }
  }

  if (priceMap.size === 0) {
    throw new Error('DSE returned no price data')
  }

  // 2. Update current_price for ALL DSE companies in a few bulk statements
  const entries = Array.from(priceMap.entries())
  for (let i = 0; i < entries.length; i += UPDATE_BATCH_SIZE) {
    const values = entries
      .slice(i, i + UPDATE_BATCH_SIZE)
      .map(([sym, p]) => Prisma.sql`(${sym}, ${p}::numeric)`)
    await prisma.$executeRaw`
      UPDATE public.dse_companies AS c
      SET current_price = v.price, updated_at = now()
      FROM (VALUES ${Prisma.join(values)}) AS v(symbol, price)
      WHERE c.symbol = v.symbol
    `
  }

  return true
}
