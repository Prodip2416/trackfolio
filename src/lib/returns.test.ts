import { describe, it, expect, vi } from 'vitest'

// Pure calculation tests; keep the DB client out of the import graph
vi.mock('@/lib/prisma', () => ({ default: {} }))

import {
  availableYears,
  canEditYearEndPrice,
  chainReturns,
  computeAllTime,
  computeYearReturn,
  holdingsAt,
  priceKey,
  requiredYearEndPrices,
  type PriceBook,
  type ReturnDividend,
  type ReturnTxn,
  type YearEndPrice
} from '@/lib/returns'

let seq = 0
const buy = (symbol: string, quantity: number, price: number, date: string, fee = 0): ReturnTxn =>
  ({ id: `t${++seq}`, stockId: `s-${symbol}`, symbol, type: 'BUY', quantity, price, fee, date })
const sell = (symbol: string, quantity: number, price: number, date: string, fee = 0): ReturnTxn =>
  ({ id: `t${++seq}`, stockId: `s-${symbol}`, symbol, type: 'SELL', quantity, price, fee, date })
const cashDiv = (symbol: string, cash: number, date: string): ReturnDividend =>
  ({ stockId: `s-${symbol}`, symbol, cash, bonus: 0, date })
const bonus = (symbol: string, qty: number, date: string): ReturnDividend =>
  ({ stockId: `s-${symbol}`, symbol, cash: 0, bonus: qty, date })

function book(yearEnd: Record<string, number | YearEndPrice>, current: Record<string, number> = {}): PriceBook {
  const m = new Map<string, YearEndPrice>()
  for (const [k, v] of Object.entries(yearEnd)) {
    const [symbol, year] = k.split('|')
    m.set(priceKey(symbol, Number(year)), typeof v === 'number' ? { price: v, priceDate: `${year}-12-30`, source: 'sync' } : v)
  }
  return { yearEnd: m, current: new Map(Object.entries(current)) }
}

const TODAY = '2026-07-02'

describe('holdingsAt / availableYears / requiredYearEndPrices', () => {
  const txns = [buy('AAA', 100, 10, '2024-03-01'), sell('AAA', 40, 12, '2025-02-01'), buy('BBB', 10, 50, '2025-05-05'), sell('BBB', 10, 55, '2025-06-01')]
  const divs = [bonus('AAA', 6, '2025-08-01')]

  it('counts buys − sells + bonus up to the date (inclusive), drops fully sold symbols', () => {
    expect(holdingsAt(txns, divs, '2024-12-31')).toEqual(new Map([['AAA', 100]]))
    expect(holdingsAt(txns, divs, '2025-12-31')).toEqual(new Map([['AAA', 66]]))
    expect(holdingsAt(txns, divs, '2024-02-29').size).toBe(0)
  })

  it('lists years from the first transaction to the current year, newest first', () => {
    expect(availableYears(txns, TODAY)).toEqual([2026, 2025, 2024])
    expect(availableYears([], TODAY)).toEqual([])
  })

  it('needs year-end prices only for symbols still held at that year end', () => {
    expect(requiredYearEndPrices(txns, divs, 2025)).toEqual([{ symbol: 'AAA', qty: 66 }])
    expect(requiredYearEndPrices(txns, divs, 2023)).toEqual([])
  })
})

describe('computeYearReturn', () => {
  it('hold all year, no trades: (V1 − V0) / V0', () => {
    const r = computeYearReturn({
      txns: [buy('AAA', 100, 10, '2024-06-30')],
      dividends: [],
      prices: book({ 'AAA|2024': 12, 'AAA|2025': 15 }),
      year: 2025,
      today: TODAY
    })
    expect(r.status).toBe('ok')
    expect(r.startValue).toBe(1200)
    expect(r.endValue).toBe(1500)
    expect(r.gain).toBe(300)
    expect(r.returnPct).toBeCloseTo(0.25, 10)
    expect(r.unrealized).toBe(300)
  })

  it('first year: buy mid-year is weighted by days invested (leap year)', () => {
    const r = computeYearReturn({
      txns: [buy('AAA', 100, 10, '2024-06-30')],
      dividends: [],
      prices: book({ 'AAA|2024': 12 }),
      year: 2024,
      today: TODAY
    })
    // 2024-06-30 is day 182 after 2023-12-31; T = 366
    const w = (366 - 182) / 366
    expect(r.startValue).toBe(0)
    expect(r.netFlow).toBe(1000)
    expect(r.weightedFlow).toBeCloseTo(1000 * w, 10)
    expect(r.gain).toBe(200)
    expect(r.returnPct).toBeCloseTo(200 / (1000 * w), 10)
  })

  it('brokerage fees: added to buys, deducted from sells', () => {
    const r = computeYearReturn({
      txns: [buy('AAA', 100, 10, '2024-01-10', 5), sell('AAA', 100, 12, '2025-07-02', 6)],
      dividends: [],
      prices: book({ 'AAA|2024': 11 }),
      year: 2025,
      today: TODAY
    })
    expect(r.buyAmount).toBe(0)
    expect(r.sellAmount).toBe(1194)
    expect(r.endValue).toBe(0)
    // gain = 0 − 1100 − (−1194) = 94
    expect(r.gain).toBe(94)
    // realized uses avg cost incl. fee: 1194 − 1005
    expect(r.realized).toBeCloseTo(189, 9)
    expect(r.unrealized).toBeCloseTo(94 - 189, 9)
    // 2025-07-02 is day 183 of 365
    const w = (365 - 183) / 365
    expect(r.returnPct).toBeCloseTo(94 / (1100 - 1194 * w), 10)
  })

  it('partial sell: realized, unrealized and dividend add up to the total gain', () => {
    const r = computeYearReturn({
      txns: [buy('AAA', 100, 10, '2024-01-10'), sell('AAA', 40, 15, '2025-04-01')],
      dividends: [cashDiv('AAA', 50, '2025-09-15')],
      prices: book({ 'AAA|2024': 12, 'AAA|2025': 14 }),
      year: 2025,
      today: TODAY
    })
    expect(r.startValue).toBe(1200)
    expect(r.endValue).toBe(840)
    expect(r.sellAmount).toBe(600)
    expect(r.dividends).toBe(50)
    expect(r.gain).toBe(840 - 1200 + 600 + 50)
    expect(r.realized).toBe(600 - 400)
    expect(r.realized + r.unrealized + r.dividends).toBeCloseTo(r.gain, 10)
    expect(r.stocks).toHaveLength(1)
    expect(r.stocks[0]).toMatchObject({ symbol: 'AAA', startQty: 100, endQty: 60, gain: r.gain })
  })

  it('bonus shares raise the end quantity without a cash flow', () => {
    const r = computeYearReturn({
      txns: [buy('AAA', 100, 10, '2024-01-10')],
      dividends: [bonus('AAA', 10, '2025-05-01')],
      prices: book({ 'AAA|2024': 10, 'AAA|2025': 10 }),
      year: 2025,
      today: TODAY
    })
    expect(r.netFlow).toBe(0)
    expect(r.endValue).toBe(1100)
    expect(r.returnPct).toBeCloseTo(0.1, 10)
  })

  it('bought and sold inside the year needs no year-end price', () => {
    const r = computeYearReturn({
      txns: [buy('AAA', 10, 100, '2025-03-01'), sell('AAA', 10, 110, '2025-03-31')],
      dividends: [],
      prices: book({}),
      year: 2025,
      today: TODAY
    })
    expect(r.status).toBe('ok')
    expect(r.missing).toEqual([])
    expect(r.gain).toBe(100)
    expect(r.realized).toBe(100)
  })

  it('running year (YTD) ends today at the live price', () => {
    const r = computeYearReturn({
      txns: [buy('AAA', 100, 10, '2025-01-10')],
      dividends: [],
      prices: book({ 'AAA|2025': 10 }, { AAA: 13 }),
      year: 2026,
      today: TODAY
    })
    expect(r.isYtd).toBe(true)
    expect(r.periodEnd).toBe(TODAY)
    expect(r.endValue).toBe(1300)
    expect(r.returnPct).toBeCloseTo(0.3, 10)
  })

  it('missing prices → no return, lists exactly what is missing', () => {
    const r = computeYearReturn({
      txns: [buy('AAA', 100, 10, '2024-01-10'), buy('BBB', 5, 20, '2024-01-10')],
      dividends: [],
      prices: book({ 'AAA|2024': 12, 'AAA|2025': 13, 'BBB|2025': 25 }),
      year: 2025,
      today: TODAY
    })
    expect(r.status).toBe('missing')
    expect(r.returnPct).toBeNull()
    expect(r.missing).toEqual([{ symbol: 'BBB', year: 2024, qty: 5 }])
    expect(r.stocks.find(s => s.symbol === 'BBB')?.gain).toBeNull()
    expect(r.stocks.find(s => s.symbol === 'AAA')?.gain).toBe(100)
  })

  it('flags a past year-end price recorded well before year end as stale', () => {
    const r = computeYearReturn({
      txns: [buy('AAA', 100, 10, '2024-01-10')],
      dividends: [],
      prices: book({ 'AAA|2024': { price: 12, priceDate: '2024-11-02', source: 'sync' }, 'AAA|2025': 15 }),
      year: 2025,
      today: TODAY
    })
    expect(r.status).toBe('ok')
    expect(r.stale).toEqual([{ symbol: 'AAA', year: 2024, priceDate: '2024-11-02' }])
  })

  it('no holdings and no activity in the year → noActivity', () => {
    const r = computeYearReturn({
      txns: [buy('AAA', 10, 10, '2023-01-10'), sell('AAA', 10, 12, '2023-05-01')],
      dividends: [],
      prices: book({}),
      year: 2024,
      today: TODAY
    })
    expect(r.status).toBe('noActivity')
    expect(r.returnPct).toBeNull()
  })

  it('only a buy on the last day of the year → invalid (no invested time)', () => {
    const r = computeYearReturn({
      txns: [buy('AAA', 10, 10, '2024-12-31')],
      dividends: [],
      prices: book({ 'AAA|2024': 10 }),
      year: 2024,
      today: TODAY
    })
    expect(r.status).toBe('invalid')
    expect(r.returnPct).toBeNull()
  })

  it('rejects future years', () => {
    expect(() => computeYearReturn({ txns: [], dividends: [], prices: book({}), year: 2027, today: TODAY })).toThrow()
  })
})

describe('canEditYearEndPrice', () => {
  it('locks only a fresh synced price', () => {
    expect(canEditYearEndPrice(undefined, 2024)).toBe(true)
    expect(canEditYearEndPrice({ price: 1, priceDate: '2024-12-30', source: 'manual' }, 2024)).toBe(true)
    expect(canEditYearEndPrice({ price: 1, priceDate: '2024-11-30', source: 'sync' }, 2024)).toBe(true)
    expect(canEditYearEndPrice({ price: 1, priceDate: '2024-12-20', source: 'sync' }, 2024)).toBe(false)
  })
})

describe('chainReturns / computeAllTime', () => {
  it('chains yearly returns and annualizes over the span', () => {
    const { cumulative, cagr } = chainReturns([0.25, 0.1], 2)
    expect(cumulative).toBeCloseTo(0.375, 10)
    expect(cagr).toBeCloseTo(Math.sqrt(1.375) - 1, 10)
    expect(chainReturns([0.2], 0.5).cagr).toBeNull()
    expect(chainReturns([-1], 2).cagr).toBe(-1)
  })

  const txns = [buy('AAA', 100, 10, '2023-12-31')]
  const full = book({ 'AAA|2023': 10, 'AAA|2024': 12, 'AAA|2025': 15 }, { AAA: 16.5 })

  it('all years known → CAGR from the first transaction to today', () => {
    const s = computeAllTime({ txns, dividends: [], prices: full, today: TODAY })
    expect(s.years.map(y => [y.year, y.status])).toEqual([[2023, 'invalid'], [2024, 'ok'], [2025, 'ok'], [2026, 'ok']])
    const growth = 1.2 * 1.25 * 1.1
    expect(s.cumulativeReturn).toBeCloseTo(growth - 1, 10)
    const span = (Date.UTC(2026, 6, 2) - Date.UTC(2023, 11, 31)) / 86_400_000 / 365.25
    expect(s.span).toBeCloseTo(span, 10)
    expect(s.cagr).toBeCloseTo(Math.pow(growth, 1 / span) - 1, 10)
    expect(s.cagrStatus).toBe('ok')
    expect(s.totalGain).toBeCloseTo(650, 10)
    expect(s.best).toEqual({ year: 2025, returnPct: expect.closeTo(0.25, 10) })
    expect(s.worst).toEqual({ year: 2026, returnPct: expect.closeTo(0.1, 10) })
  })

  it('a missing price blocks CAGR but still shows measurable years', () => {
    const s = computeAllTime({ txns, dividends: [], prices: book({ 'AAA|2023': 10, 'AAA|2025': 15 }, { AAA: 16.5 }), today: TODAY })
    expect(s.cagrStatus).toBe('missing')
    expect(s.cagr).toBeNull()
    expect(s.totalGain).toBeNull()
    expect(s.best?.year).toBe(2026)
  })

  it('less than one year of history → cumulative only', () => {
    const s = computeAllTime({ txns: [buy('AAA', 100, 10, '2026-01-02')], dividends: [], prices: book({}, { AAA: 11 }), today: TODAY })
    expect(s.cagrStatus).toBe('short')
    expect(s.cagr).toBeNull()
    expect(s.cumulativeReturn).not.toBeNull()
  })

  it('no transactions → noData', () => {
    expect(computeAllTime({ txns: [], dividends: [], prices: book({}), today: TODAY }).cagrStatus).toBe('noData')
  })
})
