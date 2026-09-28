import prisma from '@/lib/prisma'
import { recalculateStockAggregates } from '@/lib/stock-aggregates'

export async function syncDseData(userId: string) {
  console.log('Fetching live prices from DSE...')

  const priceResponse = await fetch('https://www.dse.com.bd/api/live/prices', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    cache: 'no-store'
  })

  if (!priceResponse.ok) {
    throw new Error(`DSE price API returned ${priceResponse.status}`)
  }

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
    const symbol = String(row[codeIdx]).trim().toUpperCase()
    // Fall back to previous close when the market hasn't traded this symbol yet (ltp == 0)
    const price = Number(row[ltpIdx]) || Number(row[ycpIdx])
    if (symbol && !isNaN(price)) {
      priceMap.set(symbol, price)
    }
  }

  if (priceMap.size === 0) {
    throw new Error('DSE returned no price data')
  }

  // 2. Get user's stocks to know which ones to recalculate afterwards
  const userStocks = await prisma.stocks.findMany({
    where: { user_id: userId },
    select: { id: true, symbol: true }
  })

  // 3. Update current_price for ALL DSE companies in the master table
  await Promise.all(Array.from(priceMap.entries()).map(([sym, p]) =>
    prisma.dse_companies.updateMany({
      where: { symbol: sym },
      data: { current_price: p, updated_at: new Date() }
    })
  ))

  // 4. Recalculate portfolio aggregates for the user's stocks
  await Promise.all(userStocks.map(stock => recalculateStockAggregates(stock.id)))

  return { success: true }
}
