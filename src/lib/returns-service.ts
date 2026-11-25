import prisma from '@/lib/prisma'
import { todayInDhaka } from '@/lib/date'
import { priceKey, type PriceBook, type ReturnDividend, type ReturnTxn, type YearEndPrice } from '@/lib/returns'

export type ReturnsData = {
  txns: ReturnTxn[]
  dividends: ReturnDividend[]
  prices: PriceBook
  today: string
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

/** Loads the main portfolio (transactions + dividends, never Short Term) and the prices it needs. */
export async function loadReturnsData(userId: string): Promise<ReturnsData> {
  const [txRows, divRows] = await Promise.all([
    prisma.transactions.findMany({
      where: { user_id: userId, stock_id: { not: null } },
      select: {
        id: true, stock_id: true, type: true, quantity: true, price_per_unit: true,
        brokerage_fee: true, transaction_date: true, created_at: true,
        stocks: { select: { symbol: true } }
      }
    }),
    prisma.dividends.findMany({
      where: { user_id: userId, stock_id: { not: null } },
      select: {
        stock_id: true, cash_amount: true, bonus_quantity: true, date: true, created_at: true,
        stocks: { select: { symbol: true } }
      }
    })
  ])

  const txns: ReturnTxn[] = txRows
    .filter(t => t.stock_id && t.stocks)
    .map(t => ({
      id: t.id,
      stockId: t.stock_id!,
      symbol: t.stocks!.symbol,
      type: t.type,
      quantity: Number(t.quantity),
      price: Number(t.price_per_unit),
      fee: Number(t.brokerage_fee ?? 0),
      date: iso(t.transaction_date),
      createdAt: t.created_at?.getTime()
    }))

  const dividends: ReturnDividend[] = divRows
    .filter(d => d.stock_id && d.stocks)
    .map(d => ({
      stockId: d.stock_id!,
      symbol: d.stocks!.symbol,
      cash: Number(d.cash_amount ?? 0),
      bonus: Number(d.bonus_quantity ?? 0),
      date: iso(d.date),
      createdAt: d.created_at?.getTime()
    }))

  const symbols = [...new Set([...txns.map(t => t.symbol), ...dividends.map(d => d.symbol)])]
  const [yearEndRows, companies] = symbols.length
    ? await Promise.all([
        prisma.year_end_prices.findMany({
          where: { symbol: { in: symbols } },
          select: { symbol: true, year: true, price: true, price_date: true, source: true }
        }),
        prisma.dse_companies.findMany({
          where: { symbol: { in: symbols } },
          select: { symbol: true, current_price: true }
        })
      ])
    : [[], []]

  const yearEnd = new Map<string, YearEndPrice>()
  for (const r of yearEndRows) {
    yearEnd.set(priceKey(r.symbol, r.year), {
      price: Number(r.price),
      priceDate: iso(r.price_date),
      source: r.source === 'manual' ? 'manual' : 'sync'
    })
  }
  const current = new Map<string, number>()
  for (const c of companies) if (c.current_price !== null) current.set(c.symbol, Number(c.current_price))

  return { txns, dividends, prices: { yearEnd, current }, today: todayInDhaka() }
}
