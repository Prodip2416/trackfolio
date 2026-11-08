// Pure calculation for a Short Term trade campaign, rebuilt from all of its legs.
// Realized profit uses the average-cost method on the shares still HELD, so
// shares already sold never dilute the cost basis of later buys.

export type ShortTermLeg = {
  type: 'BUY' | 'SELL'
  quantity: number
  price_per_unit: number
  brokerage_fee: number
  date: Date | string
  created_at?: Date | string | null
}

export type ShortTermTotals = {
  total_buy_qty: number
  total_sell_qty: number
  /** Average cost of ALL buys incl. fees (display: total cost = qty * avg) */
  average_buy_price: number
  /** Average net revenue per sold share (after fees) */
  average_sell_price: number
  realized_profit: number
  /** Shares still held and their remaining cost basis */
  held_qty: number
  held_cost: number
  status: 'OPEN' | 'CLOSED'
  opened_at: Date | null
  closed_at: Date | null
}

export class ShortTermCalcError extends Error {}

const time = (d: Date | string | null | undefined) => (d ? new Date(d).getTime() : 0)

export function computeShortTermTotals(legs: ShortTermLeg[]): ShortTermTotals {
  const ordered = [...legs].sort(
    (a, b) => time(a.date) - time(b.date) || time(a.created_at) - time(b.created_at)
  )

  let buyQty = 0, buyCost = 0
  let sellQty = 0, sellRevenue = 0
  let heldQty = 0, heldCost = 0
  let realized = 0
  let openedAt: Date | null = null
  let closedAt: Date | null = null

  for (const leg of ordered) {
    const qty = Number(leg.quantity)
    const price = Number(leg.price_per_unit)
    const fee = Number(leg.brokerage_fee) || 0
    const date = new Date(leg.date)

    if (leg.type === 'BUY') {
      if (!openedAt) openedAt = date
      const cost = qty * price + fee
      buyQty += qty
      buyCost += cost
      heldQty += qty
      heldCost += cost
    } else {
      if (qty > heldQty + 1e-9) {
        throw new ShortTermCalcError(
          `Cannot sell more than available holding on ${date.toISOString().slice(0, 10)}. Remaining: ${heldQty} Qty.`
        )
      }
      const avgHeld = heldQty > 0 ? heldCost / heldQty : 0
      const revenue = qty * price - fee
      realized += revenue - avgHeld * qty
      sellQty += qty
      sellRevenue += revenue
      heldCost -= avgHeld * qty
      heldQty -= qty
      if (heldQty <= 1e-9) {
        heldQty = 0
        heldCost = 0
        closedAt = date
      }
    }
  }

  const closed = buyQty > 0 && heldQty === 0
  return {
    total_buy_qty: buyQty,
    total_sell_qty: sellQty,
    average_buy_price: buyQty > 0 ? buyCost / buyQty : 0,
    average_sell_price: sellQty > 0 ? sellRevenue / sellQty : 0,
    realized_profit: realized,
    held_qty: heldQty,
    held_cost: heldCost,
    status: closed ? 'CLOSED' : 'OPEN',
    opened_at: openedAt,
    closed_at: closed ? closedAt : null,
  }
}
