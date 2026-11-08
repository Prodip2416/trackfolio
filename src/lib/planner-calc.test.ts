import { describe, it, expect } from 'vitest'
import {
  commissionAmount,
  planCost,
  roundTrip,
  averageDown,
  targetDistance,
  stopLossBreached,
  isReviewDue,
  parseTags
} from '@/lib/planner-calc'

describe('commission & plan cost', () => {
  it('computes commission from percentage', () => {
    expect(commissionAmount(10000, 0.4)).toBe(40)
    expect(commissionAmount(10000, 0)).toBe(0)
  })

  it('BUY adds commission, SELL subtracts it', () => {
    expect(planCost('BUY', 50, 200, 0.5)).toEqual({ gross: 10000, commission: 50, net: 10050 })
    expect(planCost('SELL', 50, 200, 0.5)).toEqual({ gross: 10000, commission: 50, net: 9950 })
  })
})

describe('roundTrip', () => {
  it('computes profit, return and breakeven', () => {
    const r = roundTrip(100, 110, 100, 0.5)
    expect(r.buyCost).toBe(10050)
    expect(r.sellProceeds).toBe(10945)
    expect(r.profit).toBe(895)
    expect(r.totalCommission).toBe(105)
    expect(r.returnPct).toBe(8.91)
    expect(r.breakeven).toBe(101.01)
  })

  it('breakeven equals buy price with zero commission', () => {
    const r = roundTrip(42.5, 40, 10, 0)
    expect(r.breakeven).toBe(42.5)
    expect(r.profit).toBe(-25)
  })

  it('selling at breakeven gives ~zero profit', () => {
    const r = roundTrip(100, 101.01, 1000, 0.5)
    expect(Math.abs(r.profit)).toBeLessThan(5)
  })
})

describe('averageDown', () => {
  it('lowers average when buying cheaper', () => {
    const r = averageDown(100, 50, 100, 30, 0)
    expect(r.newQty).toBe(200)
    expect(r.newAvg).toBe(40)
    expect(r.avgChange).toBe(-10)
  })

  it('includes commission in the added cost', () => {
    const r = averageDown(0, 0, 100, 10, 1)
    expect(r.addCost).toBe(1010)
    expect(r.newAvg).toBe(10.1)
  })

  it('handles zero quantity safely', () => {
    expect(averageDown(0, 0, 0, 10, 0.5).newAvg).toBe(0)
  })
})

describe('targetDistance', () => {
  it('BUY hits when price falls to plan', () => {
    expect(targetDistance('BUY', 50, 49).hit).toBe(true)
    expect(targetDistance('BUY', 50, 50).hit).toBe(true)
    expect(targetDistance('BUY', 50, 55)).toEqual({ diff: 5, diffPct: 10, hit: false })
  })

  it('SELL hits when price rises to plan', () => {
    expect(targetDistance('SELL', 50, 51).hit).toBe(true)
    expect(targetDistance('SELL', 50, 45)).toEqual({ diff: -5, diffPct: -10, hit: false })
  })

  it('returns nulls without a current price', () => {
    expect(targetDistance('BUY', 50, null)).toEqual({ diff: null, diffPct: null, hit: false })
    expect(targetDistance('BUY', 50, 0).hit).toBe(false)
  })
})

describe('stopLossBreached', () => {
  it('works per direction', () => {
    expect(stopLossBreached('BUY', 40, 39)).toBe(true)
    expect(stopLossBreached('BUY', 40, 45)).toBe(false)
    expect(stopLossBreached('SELL', 60, 61)).toBe(true)
    expect(stopLossBreached('BUY', null, 10)).toBe(false)
  })
})

describe('isReviewDue', () => {
  it('compares ISO dates', () => {
    expect(isReviewDue('2026-11-08', '2026-11-08')).toBe(true)
    expect(isReviewDue('2026-11-01', '2026-11-08')).toBe(true)
    expect(isReviewDue('2026-11-09', '2026-11-08')).toBe(false)
    expect(isReviewDue(null, '2026-11-08')).toBe(false)
  })
})

describe('parseTags', () => {
  it('normalises, dedupes and limits', () => {
    expect(parseTags(' Idea, NEWS ,idea, , big win ')).toEqual(['idea', 'news', 'big-win'])
    expect(parseTags('')).toEqual([])
    expect(parseTags(Array.from({ length: 15 }, (_, i) => `t${i}`).join(',')).length).toBe(10)
  })
})
