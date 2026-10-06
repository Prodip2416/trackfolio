import { describe, it, expect, vi } from 'vitest'

// Pure calculation tests; keep the DB client out of the import graph
vi.mock('@/lib/prisma', () => ({ default: {} }))

import { computeHoldingTimeline, OversellError, type TimelineTransaction, type TimelineDividend } from '@/lib/stock-aggregates'

const d = (s: string) => new Date(`${s}T00:00:00Z`)

let seq = 0
const tx = (type: 'BUY' | 'SELL', quantity: number, price: number, date: string, fee = 0, createdAt?: number): TimelineTransaction => ({
  id: `t${++seq}`,
  type,
  quantity,
  price_per_unit: price,
  brokerage_fee: fee,
  transaction_date: d(date),
  created_at: new Date(createdAt ?? seq)
})

const div = (date: string, { cash = null, bonus = null }: { cash?: number | null, bonus?: number | null }): TimelineDividend => ({
  cash_amount: cash,
  bonus_quantity: bonus,
  date: d(date)
})

describe('computeHoldingTimeline', () => {
  it('returns an empty holding with no events', () => {
    const r = computeHoldingTimeline([], [])
    expect(r).toMatchObject({ totalQuantity: 0, totalInvestment: 0, averageBuyPrice: 0, portfolioPrice: 0, oversell: null })
    expect(r.realizedSells).toEqual([])
  })

  it('computes weighted average cost including fees', () => {
    const r = computeHoldingTimeline([tx('BUY', 100, 10, '2026-01-01', 20), tx('BUY', 100, 20, '2026-01-02')], [])
    expect(r.totalQuantity).toBe(200)
    expect(r.totalInvestment).toBe(3020)
    expect(r.averageBuyPrice).toBeCloseTo(15.1)
    expect(r.portfolioPrice).toBeCloseTo(15.1)
  })

  it('realizes gain net of sell fee and keeps average cost on sell', () => {
    const r = computeHoldingTimeline([tx('BUY', 100, 10, '2026-01-01'), tx('SELL', 40, 15, '2026-01-05', 6)], [])
    expect(r.realizedSells[0]).toMatchObject({ qtySold: 40, sellValue: 594, costValue: 400, realizedGain: 194 })
    expect(r.totalQuantity).toBe(60)
    expect(r.totalInvestment).toBe(600)
    expect(r.averageBuyPrice).toBe(10)
  })

  it('processes a same-day BUY before a SELL regardless of entry order', () => {
    const r = computeHoldingTimeline([tx('SELL', 50, 12, '2026-01-01', 0, 1), tx('BUY', 100, 10, '2026-01-01', 0, 2)], [])
    expect(r.oversell).toBeNull()
    expect(r.totalQuantity).toBe(50)
    expect(r.realizedSells[0].realizedGain).toBe(100)
  })

  it('flags the first oversell with available quantity', () => {
    const r = computeHoldingTimeline([tx('BUY', 10, 10, '2026-01-01'), tx('SELL', 20, 10, '2026-01-02')], [])
    expect(r.oversell).toEqual({ date: d('2026-01-02'), attempted: 20, available: 10 })
    expect(r.totalQuantity).toBe(0)
  })

  it('dilutes cost basis with bonus shares but keeps average buy price pure', () => {
    const r = computeHoldingTimeline([tx('BUY', 100, 10, '2026-01-01')], [div('2026-02-01', { bonus: 10 })])
    expect(r.totalQuantity).toBe(110)
    expect(r.averageBuyPrice).toBe(10)
    expect(r.portfolioPrice).toBeCloseTo(1000 / 110)
  })

  it('uses bonus-diluted cost for realized gains', () => {
    const r = computeHoldingTimeline(
      [tx('BUY', 100, 10, '2026-01-01'), tx('SELL', 110, 10, '2026-03-01')],
      [div('2026-02-01', { bonus: 10 })]
    )
    expect(r.realizedSells[0].costValue).toBeCloseTo(1000)
    expect(r.realizedSells[0].realizedGain).toBeCloseTo(100)
    expect(r.totalQuantity).toBe(0)
  })

  it('weights a later buy by purchased shares only, not bonus shares', () => {
    const r = computeHoldingTimeline(
      [tx('BUY', 100, 10, '2026-01-01'), tx('BUY', 100, 20, '2026-03-01')],
      [div('2026-02-01', { bonus: 100 })]
    )
    expect(r.averageBuyPrice).toBe(15)
    expect(r.totalQuantity).toBe(300)
  })

  it('reduces portfolio price by cash dividends', () => {
    const r = computeHoldingTimeline([tx('BUY', 100, 10, '2026-01-01')], [div('2026-02-01', { cash: 100 })])
    expect(r.portfolioPrice).toBe(9)
    expect(r.totalInvestment).toBe(1000)
  })

  it('ignores a cash dividend received while holding nothing', () => {
    const r = computeHoldingTimeline(
      [tx('BUY', 10, 10, '2026-01-01'), tx('SELL', 10, 10, '2026-01-02'), tx('BUY', 10, 10, '2026-03-01')],
      [div('2026-02-01', { cash: 50 })]
    )
    expect(r.portfolioPrice).toBe(10)
  })

  it('resets the average after a full exit', () => {
    const r = computeHoldingTimeline(
      [tx('BUY', 10, 10, '2026-01-01'), tx('SELL', 10, 12, '2026-01-02'), tx('BUY', 10, 30, '2026-01-03')],
      []
    )
    expect(r.averageBuyPrice).toBe(30)
  })
})

describe('OversellError', () => {
  it('formats a readable message', () => {
    const err = new OversellError({ date: d('2026-01-02'), attempted: 20, available: 10 })
    expect(err.message).toBe('Cannot sell 20 shares on 2026-01-02. Only 10 available at that date.')
  })
})
