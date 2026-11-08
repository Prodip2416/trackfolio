import { describe, it, expect } from 'vitest'
import { computeShortTermTotals, ShortTermCalcError, type ShortTermLeg } from './short-term-calc'

const leg = (type: 'BUY' | 'SELL', quantity: number, price: number, date: string, fee = 0): ShortTermLeg => ({
  type, quantity, price_per_unit: price, brokerage_fee: fee, date,
})

describe('computeShortTermTotals', () => {
  it('does not let sold shares dilute the cost of later buys', () => {
    const r = computeShortTermTotals([
      leg('BUY', 100, 10, '2026-01-01'),
      leg('SELL', 50, 12, '2026-01-02'),
      leg('BUY', 50, 20, '2026-01-03'),
      leg('SELL', 100, 20, '2026-01-04'),
    ])
    expect(r.realized_profit).toBeCloseTo(600)
    expect(r.status).toBe('CLOSED')
    expect(r.closed_at?.toISOString().slice(0, 10)).toBe('2026-01-04')
    expect(r.total_buy_qty).toBe(150)
    expect(r.total_sell_qty).toBe(150)
  })

  it('includes fees in cost and revenue', () => {
    const r = computeShortTermTotals([
      leg('BUY', 10, 100, '2026-01-01', 5),
      leg('SELL', 10, 110, '2026-01-02', 5),
    ])
    expect(r.realized_profit).toBeCloseTo(90)
    expect(r.average_buy_price).toBeCloseTo(100.5)
    expect(r.average_sell_price).toBeCloseTo(109.5)
  })

  it('keeps remaining cost basis on partial sells', () => {
    const r = computeShortTermTotals([
      leg('BUY', 100, 10, '2026-01-01'),
      leg('BUY', 100, 20, '2026-01-02'),
      leg('SELL', 50, 30, '2026-01-03'),
    ])
    expect(r.realized_profit).toBeCloseTo(750)
    expect(r.held_qty).toBe(150)
    expect(r.held_cost).toBeCloseTo(2250)
    expect(r.status).toBe('OPEN')
    expect(r.closed_at).toBeNull()
  })

  it('orders legs by date regardless of input order', () => {
    const r = computeShortTermTotals([
      leg('SELL', 100, 20, '2026-01-04'),
      leg('BUY', 50, 20, '2026-01-03'),
      leg('BUY', 100, 10, '2026-01-01'),
      leg('SELL', 50, 12, '2026-01-02'),
    ])
    expect(r.realized_profit).toBeCloseTo(600)
    expect(r.opened_at?.toISOString().slice(0, 10)).toBe('2026-01-01')
  })

  it('rejects a sell that exceeds holdings at that date', () => {
    expect(() => computeShortTermTotals([
      leg('SELL', 10, 12, '2026-01-01'),
      leg('BUY', 10, 10, '2026-01-02'),
    ])).toThrow(ShortTermCalcError)
  })
})
