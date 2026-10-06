import prisma from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'

type Db = typeof prisma | Prisma.TransactionClient
type Num = number | Prisma.Decimal | null | undefined

export type TimelineTransaction = {
  id: string
  type: 'BUY' | 'SELL'
  quantity: Num
  price_per_unit: Num
  brokerage_fee: Num
  transaction_date: Date
  created_at?: Date | null
}

export type TimelineDividend = {
  cash_amount: Num
  bonus_quantity: Num
  date: Date
  created_at?: Date | null
}

export type RealizedSell = {
  id: string
  date: Date
  qtySold: number
  sellValue: number
  costValue: number
  realizedGain: number
}

export type Oversell = {
  date: Date
  attempted: number
  available: number
}

export type HoldingTimelineResult = {
  totalQuantity: number
  totalInvestment: number
  averageBuyPrice: number
  portfolioPrice: number
  realizedSells: RealizedSell[]
  oversell: Oversell | null
}

export class OversellError extends Error {
  constructor(public oversell: Oversell) {
    const date = oversell.date.toISOString().slice(0, 10)
    super(`Cannot sell ${oversell.attempted} shares on ${date}. Only ${oversell.available} available at that date.`)
    this.name = 'OversellError'
  }
}

const EPSILON = 1e-9

// Same-day ordering: BUYs first, then dividends (bonus), then SELLs
const SAME_DAY_RANK = { BUY: 0, DIV: 1, SELL: 2 } as const

/**
 * Replays transactions and dividends chronologically using weighted average cost.
 * Single source of truth for holdings, cost basis and realized gains.
 */
export function computeHoldingTimeline(
  transactions: TimelineTransaction[],
  dividends: TimelineDividend[]
): HoldingTimelineResult {
  type TimelineEvent =
    | { kind: 'BUY' | 'SELL', date: Date, createdAt: number, data: TimelineTransaction }
    | { kind: 'DIV', date: Date, createdAt: number, data: TimelineDividend }

  const events: TimelineEvent[] = [
    ...transactions.map(t => ({ kind: t.type, date: t.transaction_date, createdAt: t.created_at?.getTime() ?? 0, data: t })),
    ...dividends.map(d => ({ kind: 'DIV' as const, date: d.date, createdAt: d.created_at?.getTime() ?? 0, data: d }))
  ].sort((a, b) =>
    a.date.getTime() - b.date.getTime() ||
    SAME_DAY_RANK[a.kind] - SAME_DAY_RANK[b.kind] ||
    a.createdAt - b.createdAt
  )

  let totalQuantity = 0
  let totalInvestment = 0 // Cost basis (bonus shares add qty at zero cost)
  let averageBuyPrice = 0 // Pure purchase average, excluding bonus/dividends
  let purchasedQty = 0 // Held shares that were bought (excludes bonus), weights averageBuyPrice
  let portfolioCost = 0 // Cost basis net of cash dividends
  let oversell: Oversell | null = null
  const realizedSells: RealizedSell[] = []

  const resetIfEmpty = () => {
    if (totalQuantity <= EPSILON) {
      totalQuantity = 0
      totalInvestment = 0
      portfolioCost = 0
      averageBuyPrice = 0
      purchasedQty = 0
    }
  }

  for (const event of events) {
    if (event.kind === 'DIV') {
      const div = event.data
      const cash = Number(div.cash_amount || 0)
      const bonus = Number(div.bonus_quantity || 0)
      // A cash dividend can't reduce cost below zero when nothing is held
      if (cash && totalQuantity > 0) {
        portfolioCost = Math.max(0, portfolioCost - cash)
      }
      if (bonus) {
        totalQuantity += bonus
      }
      continue
    }

    const txn = event.data
    const qty = Number(txn.quantity)
    const price = Number(txn.price_per_unit)
    const fee = Number(txn.brokerage_fee || 0)

    if (event.kind === 'BUY') {
      const cost = (qty * price) + fee
      averageBuyPrice = ((purchasedQty * averageBuyPrice) + cost) / (purchasedQty + qty)
      purchasedQty += qty
      totalQuantity += qty
      totalInvestment += cost
      portfolioCost += cost
    } else {
      if (qty > totalQuantity + EPSILON && !oversell) {
        oversell = { date: event.date, attempted: qty, available: totalQuantity }
      }
      const soldQty = Math.min(qty, totalQuantity)
      const costPerUnit = totalQuantity > 0 ? totalInvestment / totalQuantity : 0
      const portfolioPerUnit = totalQuantity > 0 ? portfolioCost / totalQuantity : 0
      const costValue = costPerUnit * soldQty
      const sellValue = (qty * price) - fee

      realizedSells.push({
        id: txn.id,
        date: event.date,
        qtySold: qty,
        sellValue,
        costValue,
        realizedGain: sellValue - costValue
      })

      // Sold shares come proportionally from purchased and bonus shares
      if (totalQuantity > 0) purchasedQty -= purchasedQty * (soldQty / totalQuantity)
      totalQuantity -= soldQty
      totalInvestment -= costValue
      portfolioCost -= portfolioPerUnit * soldQty
      resetIfEmpty()
    }
  }

  return {
    totalQuantity,
    totalInvestment,
    averageBuyPrice,
    portfolioPrice: totalQuantity > 0 ? portfolioCost / totalQuantity : 0,
    realizedSells,
    oversell
  }
}

/**
 * Recomputes and stores aggregates for a stock.
 * With `strict`, throws OversellError if any SELL exceeds the holding at its date
 * (call inside prisma.$transaction so the triggering write rolls back).
 */
export async function recalculateStockAggregates(
  stockId: string,
  { db = prisma, strict = false }: { db?: Db, strict?: boolean } = {}
) {
  const [transactions, dividends] = await Promise.all([
    db.transactions.findMany({ where: { stock_id: stockId } }),
    db.dividends.findMany({ where: { stock_id: stockId } })
  ])

  const result = computeHoldingTimeline(transactions, dividends)

  if (strict && result.oversell) {
    throw new OversellError(result.oversell)
  }

  await db.stocks.update({
    where: { id: stockId },
    data: {
      total_quantity: result.totalQuantity,
      total_investment: result.totalInvestment,
      average_buy_price: result.averageBuyPrice,
      portfolio_price: result.portfolioPrice,
      updated_at: new Date()
    }
  })

  return result
}
