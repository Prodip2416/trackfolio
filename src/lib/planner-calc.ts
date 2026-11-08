/**
 * Pure calculations for the Planner module (no DB, no React).
 * Commission is always a user-entered percentage of the traded amount.
 */

export type PlanType = 'BUY' | 'SELL'
export type PlanStatus = 'IDEA' | 'ACTIVE' | 'EXECUTED' | 'CANCELLED'

export const OPEN_PLAN_STATUSES: PlanStatus[] = ['IDEA', 'ACTIVE']

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

/** Commission in ৳ for a trade amount. */
export function commissionAmount(amount: number, commissionPct: number): number {
  return round2((amount * commissionPct) / 100)
}

/** Total cash for a plan: BUY = pay gross + fee, SELL = receive gross - fee. */
export function planCost(type: PlanType, price: number, quantity: number, commissionPct: number) {
  const gross = round2(price * quantity)
  const commission = commissionAmount(gross, commissionPct)
  const net = type === 'BUY' ? round2(gross + commission) : round2(gross - commission)
  return { gross, commission, net }
}

/** Buy at buyPrice, sell at sellPrice, commission on both legs. */
export function roundTrip(buyPrice: number, sellPrice: number, quantity: number, commissionPct: number) {
  const buy = planCost('BUY', buyPrice, quantity, commissionPct)
  const sell = planCost('SELL', sellPrice, quantity, commissionPct)
  const profit = round2(sell.net - buy.net)
  const returnPct = buy.net > 0 ? round2((profit / buy.net) * 100) : 0
  const c = commissionPct / 100
  // sellPrice * qty * (1 - c) = buyPrice * qty * (1 + c)
  const breakeven = c < 1 ? round2((buyPrice * (1 + c)) / (1 - c)) : 0
  return {
    buyCost: buy.net,
    buyCommission: buy.commission,
    sellProceeds: sell.net,
    sellCommission: sell.commission,
    totalCommission: round2(buy.commission + sell.commission),
    profit,
    returnPct,
    breakeven
  }
}

/** New average cost after adding shares to an existing holding (commission included in cost). */
export function averageDown(
  holdQty: number,
  holdAvg: number,
  addQty: number,
  addPrice: number,
  commissionPct: number
) {
  const existingCost = holdQty * holdAvg
  const addCost = planCost('BUY', addPrice, addQty, commissionPct).net
  const newQty = holdQty + addQty
  const newAvg = newQty > 0 ? round2((existingCost + addCost) / newQty) : 0
  const avgChange = round2(newAvg - holdAvg)
  return { newQty, newAvg, addCost, totalCost: round2(existingCost + addCost), avgChange }
}

/**
 * Distance of current price from the plan price.
 * BUY hits when price falls to/below plan price; SELL hits when price rises to/above it.
 */
export function targetDistance(type: PlanType, planPrice: number, currentPrice: number | null) {
  if (currentPrice === null || !(currentPrice > 0) || !(planPrice > 0)) {
    return { diff: null, diffPct: null, hit: false }
  }
  const diff = round2(currentPrice - planPrice)
  const diffPct = round2((diff / planPrice) * 100)
  const hit = type === 'BUY' ? currentPrice <= planPrice : currentPrice >= planPrice
  return { diff, diffPct, hit }
}

/** Stop-loss breached: BUY plan → current at/below stop; SELL plan → current at/above stop. */
export function stopLossBreached(type: PlanType, stopLoss: number | null, currentPrice: number | null): boolean {
  if (stopLoss === null || currentPrice === null || !(stopLoss > 0) || !(currentPrice > 0)) return false
  return type === 'BUY' ? currentPrice <= stopLoss : currentPrice >= stopLoss
}

/** True when a YYYY-MM-DD review date is today or overdue. */
export function isReviewDue(reviewDate: string | null, today: string): boolean {
  return !!reviewDate && reviewDate <= today
}

/** Normalise a comma-separated tag string into unique lowercase tags. */
export function parseTags(input: string): string[] {
  const seen = new Set<string>()
  for (const raw of input.split(',')) {
    const t = raw.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 30)
    if (t) seen.add(t)
  }
  return [...seen].slice(0, 10)
}
