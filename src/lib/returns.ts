import { computeHoldingTimeline } from '@/lib/stock-aggregates'

/**
 * Yearly Return (Modified Dietz) and CAGR for the main portfolio.
 * Pure functions: callers load transactions, dividends and prices (Short Term is never included).
 *
 * A year Y is measured from 31 Dec Y-1 (start value) to 31 Dec Y, or to today for the
 * running year (YTD, priced at the live current price). Only year-end prices are needed:
 * cash flows inside the year come from the transactions themselves.
 */

export type ReturnTxn = {
  id: string
  stockId: string
  symbol: string
  type: 'BUY' | 'SELL'
  quantity: number
  price: number
  fee: number
  date: string // YYYY-MM-DD
  createdAt?: number
}

export type ReturnDividend = {
  stockId: string
  symbol: string
  cash: number
  bonus: number
  date: string // YYYY-MM-DD
  createdAt?: number
}

export type YearEndPrice = { price: number; priceDate: string; source: 'sync' | 'manual' }

export type PriceBook = {
  /** key: priceKey(symbol, year) */
  yearEnd: Map<string, YearEndPrice>
  /** symbol → live price (used for the running year) */
  current: Map<string, number>
}

export type MissingPrice = { symbol: string; year: number; qty: number }

export type StockYearRow = {
  symbol: string
  startQty: number
  startPrice: number | null
  startValue: number
  buyAmount: number
  sellAmount: number
  dividend: number
  realized: number
  endQty: number
  endPrice: number | null
  endValue: number
  /** null when a needed price is missing */
  gain: number | null
  /** paper gain/loss of the year: gain − realized − dividend; null when gain is null */
  unrealized: number | null
}

export type YearStatus = 'ok' | 'missing' | 'noActivity' | 'invalid'

export type YearReturn = {
  year: number
  isYtd: boolean
  periodStart: string
  periodEnd: string
  startValue: number
  endValue: number
  buyAmount: number
  sellAmount: number
  /** buys − sells */
  netFlow: number
  /** Σ flow × weight (share of the period the money was invested) */
  weightedFlow: number
  dividends: number
  realized: number
  unrealized: number
  gain: number
  /** fraction (0.25 = 25%); null unless status is 'ok' */
  returnPct: number | null
  status: YearStatus
  missing: MissingPrice[]
  /** year-end prices recorded before STALE_DAY of their year (only for past years) */
  stale: { symbol: string; year: number; priceDate: string }[]
  stocks: StockYearRow[]
}

export type CagrStatus = 'ok' | 'missing' | 'short' | 'noData'

export type AllTimeSummary = {
  years: YearReturn[]
  firstDate: string | null
  /** years between the first transaction and the end date */
  span: number
  cumulativeReturn: number | null
  cagr: number | null
  cagrStatus: CagrStatus
  totalGain: number | null
  totalDividends: number
  totalRealized: number
  best: { year: number; returnPct: number } | null
  worst: { year: number; returnPct: number } | null
}

const EPS = 1e-9
const DAY_MS = 86_400_000
/** A past year's stored price older than this day (MM-DD) is flagged as possibly stale. */
export const STALE_DAY = '12-20'

export const priceKey = (symbol: string, year: number) => `${symbol}|${year}`

const dayNo = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / DAY_MS
const utcDate = (iso: string) => new Date(`${iso}T00:00:00.000Z`)
const yearOf = (iso: string) => Number(iso.slice(0, 4))

export const isStalePrice = (p: YearEndPrice, year: number) => p.priceDate < `${year}-${STALE_DAY}`

/**
 * A past year's price may be entered by hand when none exists, when it was entered by hand,
 * or when the synced price is stale (no sync near year end). A fresh synced price is locked.
 */
export const canEditYearEndPrice = (existing: YearEndPrice | undefined, year: number) =>
  !existing || existing.source === 'manual' || isStalePrice(existing, year)

/** Shares held per symbol at the end of `date` (BUY − SELL + bonus). */
export function holdingsAt(txns: ReturnTxn[], dividends: ReturnDividend[], date: string): Map<string, number> {
  const qty = new Map<string, number>()
  const add = (s: string, q: number) => qty.set(s, (qty.get(s) ?? 0) + q)
  for (const t of txns) if (t.date <= date) add(t.symbol, t.type === 'BUY' ? t.quantity : -t.quantity)
  for (const d of dividends) if (d.date <= date && d.bonus) add(d.symbol, d.bonus)
  for (const [s, q] of qty) {
    if (q <= EPS) qty.delete(s)
  }
  return qty
}

/** Years with portfolio history, newest first (first transaction year → current year). */
export function availableYears(txns: ReturnTxn[], today: string): number[] {
  if (txns.length === 0) return []
  const first = Math.min(...txns.map(t => yearOf(t.date)))
  const current = yearOf(today)
  const years: number[] = []
  for (let y = current; y >= first; y--) years.push(y)
  return years
}

/** Symbols held at the end of `year` (need a stored year-end price for that year). */
export function requiredYearEndPrices(txns: ReturnTxn[], dividends: ReturnDividend[], year: number) {
  return [...holdingsAt(txns, dividends, `${year}-12-31`)]
    .map(([symbol, qty]) => ({ symbol, qty }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
}

/** Realized gain per symbol for sells dated inside (start, end]. Same avg-cost logic as the Sell report. */
function realizedBySymbol(txns: ReturnTxn[], dividends: ReturnDividend[], start: string, end: string) {
  const byStock = new Map<string, { symbol: string; txns: ReturnTxn[]; divs: ReturnDividend[] }>()
  const bucket = (stockId: string, symbol: string) => {
    let b = byStock.get(stockId)
    if (!b) byStock.set(stockId, (b = { symbol, txns: [], divs: [] }))
    return b
  }
  for (const t of txns) if (t.date <= end) bucket(t.stockId, t.symbol).txns.push(t)
  for (const d of dividends) if (d.date <= end) bucket(d.stockId, d.symbol).divs.push(d)

  const out = new Map<string, number>()
  for (const { symbol, txns: ts, divs } of byStock.values()) {
    const { realizedSells } = computeHoldingTimeline(
      ts.map(t => ({
        id: t.id,
        type: t.type,
        quantity: t.quantity,
        price_per_unit: t.price,
        brokerage_fee: t.fee,
        transaction_date: utcDate(t.date),
        created_at: t.createdAt !== undefined ? new Date(t.createdAt) : null
      })),
      divs.map(d => ({
        cash_amount: d.cash,
        bonus_quantity: d.bonus,
        date: utcDate(d.date),
        created_at: d.createdAt !== undefined ? new Date(d.createdAt) : null
      }))
    )
    const startDay = dayNo(start)
    const sum = realizedSells
      .filter(s => s.date.getTime() / DAY_MS > startDay)
      .reduce((acc, s) => acc + s.realizedGain, 0)
    if (sum) out.set(symbol, (out.get(symbol) ?? 0) + sum)
  }
  return out
}

/**
 * Modified Dietz return of one calendar year:
 *   gain   = V1 − V0 − Σflows + cash dividends
 *   return = gain ÷ (V0 + Σ flow × (T − t) / T)
 * BUY flow = qty×price + fee, SELL flow = −(qty×price − fee); bonus shares carry no cash flow.
 */
export function computeYearReturn(params: {
  txns: ReturnTxn[]
  dividends: ReturnDividend[]
  prices: PriceBook
  year: number
  today: string
}): YearReturn {
  const { txns, dividends, prices, year, today } = params
  const currentYear = yearOf(today)
  if (year > currentYear) throw new Error(`Year ${year} is in the future`)

  const isYtd = year === currentYear
  const periodStart = `${year - 1}-12-31`
  const periodEnd = isYtd ? today : `${year}-12-31`
  const t0 = dayNo(periodStart)
  const T = dayNo(periodEnd) - t0

  const startQty = holdingsAt(txns, dividends, periodStart)
  const endQty = holdingsAt(txns, dividends, periodEnd)
  const realized = realizedBySymbol(txns, dividends, periodStart, periodEnd)

  const missing: MissingPrice[] = []
  const stale: YearReturn['stale'] = []
  const rows = new Map<string, StockYearRow>()
  const row = (symbol: string) => {
    let r = rows.get(symbol)
    if (!r) {
      rows.set(symbol, (r = {
        symbol, startQty: 0, startPrice: null, startValue: 0, buyAmount: 0, sellAmount: 0,
        dividend: 0, realized: 0, endQty: 0, endPrice: null, endValue: 0, gain: null, unrealized: null
      }))
    }
    return r
  }

  const pastPrice = (symbol: string, y: number, qty: number): number | null => {
    const p = prices.yearEnd.get(priceKey(symbol, y))
    if (!p) {
      missing.push({ symbol, year: y, qty })
      return null
    }
    if (isStalePrice(p, y)) stale.push({ symbol, year: y, priceDate: p.priceDate })
    return p.price
  }

  for (const [symbol, qty] of startQty) {
    const r = row(symbol)
    r.startQty = qty
    r.startPrice = pastPrice(symbol, year - 1, qty)
    r.startValue = r.startPrice === null ? 0 : qty * r.startPrice
  }

  for (const [symbol, qty] of endQty) {
    const r = row(symbol)
    r.endQty = qty
    if (isYtd) {
      const p = prices.current.get(symbol)
      if (p && p > 0) r.endPrice = p
      else missing.push({ symbol, year, qty })
    } else {
      r.endPrice = pastPrice(symbol, year, qty)
    }
    r.endValue = r.endPrice === null ? 0 : qty * r.endPrice
  }

  let weightedFlow = 0
  for (const t of txns) {
    if (t.date <= periodStart || t.date > periodEnd) continue
    const r = row(t.symbol)
    const amount = t.type === 'BUY' ? t.quantity * t.price + t.fee : -(t.quantity * t.price - t.fee)
    if (t.type === 'BUY') r.buyAmount += amount
    else r.sellAmount -= amount
    const w = T > 0 ? (T - (dayNo(t.date) - t0)) / T : 0
    weightedFlow += amount * w
  }

  for (const d of dividends) {
    if (d.date <= periodStart || d.date > periodEnd || !d.cash) continue
    row(d.symbol).dividend += d.cash
  }

  for (const [symbol, gain] of realized) row(symbol).realized = gain

  const missingSymbols = new Set(missing.map(m => m.symbol))
  for (const r of rows.values()) {
    r.gain = missingSymbols.has(r.symbol)
      ? null
      : r.endValue - r.startValue - (r.buyAmount - r.sellAmount) + r.dividend
    r.unrealized = r.gain === null ? null : r.gain - r.realized - r.dividend
  }

  const stocks = [...rows.values()].sort((a, b) => a.symbol.localeCompare(b.symbol))
  const sum = (f: (r: StockYearRow) => number) => stocks.reduce((acc, r) => acc + f(r), 0)

  const startValue = sum(r => r.startValue)
  const endValue = sum(r => r.endValue)
  const buyAmount = sum(r => r.buyAmount)
  const sellAmount = sum(r => r.sellAmount)
  const divTotal = sum(r => r.dividend)
  const realizedTotal = sum(r => r.realized)
  const netFlow = buyAmount - sellAmount
  const gain = endValue - startValue - netFlow + divTotal
  const denominator = startValue + weightedFlow

  let status: YearStatus
  if (missing.length) status = 'missing'
  else if (startQty.size === 0 && endQty.size === 0 && buyAmount === 0 && sellAmount === 0 && divTotal === 0) status = 'noActivity'
  else if (denominator <= EPS) status = 'invalid'
  else status = 'ok'

  return {
    year,
    isYtd,
    periodStart,
    periodEnd,
    startValue,
    endValue,
    buyAmount,
    sellAmount,
    netFlow,
    weightedFlow,
    dividends: divTotal,
    realized: realizedTotal,
    unrealized: gain - realizedTotal - divTotal,
    gain,
    returnPct: status === 'ok' ? gain / denominator : null,
    status,
    missing,
    stale,
    stocks
  }
}

export type Mover = { symbol: string; gain: number }

/**
 * Stock with the biggest gain (> 0) and the biggest loss (< 0) in the year.
 * Stocks whose gain can't be measured (missing price) are ignored.
 */
export function topMovers(stocks: StockYearRow[]): { gainer: Mover | null; loser: Mover | null } {
  let gainer: Mover | null = null
  let loser: Mover | null = null
  for (const s of stocks) {
    if (s.gain === null) continue
    if (s.gain > EPS && (!gainer || s.gain > gainer.gain)) gainer = { symbol: s.symbol, gain: s.gain }
    if (s.gain < -EPS && (!loser || s.gain < loser.gain)) loser = { symbol: s.symbol, gain: s.gain }
  }
  return { gainer, loser }
}

/** Chain-links yearly returns into a cumulative return and annualizes it (CAGR). */
export function chainReturns(returns: number[], span: number): { cumulative: number; cagr: number | null } {
  const growth = returns.reduce((acc, r) => acc * (1 + r), 1)
  const cumulative = growth - 1
  if (span < 1) return { cumulative, cagr: null }
  return { cumulative, cagr: growth <= 0 ? -1 : Math.pow(growth, 1 / span) - 1 }
}

/**
 * All-time view: every year since the first transaction, cumulative return and CAGR.
 * A year whose return can't be measured because no money was invested for any length of
 * time ('invalid', e.g. first buy on 31 Dec) counts as 0% in the chain.
 */
export function computeAllTime(params: {
  txns: ReturnTxn[]
  dividends: ReturnDividend[]
  prices: PriceBook
  today: string
}): AllTimeSummary {
  const { txns, dividends, prices, today } = params
  const years = availableYears(txns, today)
    .slice()
    .reverse()
    .map(year => computeYearReturn({ txns, dividends, prices, year, today }))
    .filter(y => y.status !== 'noActivity')

  const firstDate = txns.length ? txns.reduce((m, t) => (t.date < m ? t.date : m), txns[0].date) : null
  const span = firstDate ? Math.max(0, (dayNo(today) - dayNo(firstDate)) / 365.25) : 0
  const totalDividends = years.reduce((a, y) => a + y.dividends, 0)
  const totalRealized = years.reduce((a, y) => a + y.realized, 0)

  const base = { years, firstDate, span, totalDividends, totalRealized }
  if (years.length === 0) {
    return { ...base, cumulativeReturn: null, cagr: null, cagrStatus: 'noData', totalGain: null, best: null, worst: null }
  }

  const measured = years.filter(y => y.status === 'ok') as (YearReturn & { returnPct: number })[]
  const best = measured.length ? measured.reduce((a, b) => (b.returnPct > a.returnPct ? b : a)) : null
  const worst = measured.length ? measured.reduce((a, b) => (b.returnPct < a.returnPct ? b : a)) : null
  const extremes = {
    best: best ? { year: best.year, returnPct: best.returnPct } : null,
    worst: worst ? { year: worst.year, returnPct: worst.returnPct } : null
  }

  if (years.some(y => y.status === 'missing')) {
    return { ...base, ...extremes, cumulativeReturn: null, cagr: null, cagrStatus: 'missing', totalGain: null }
  }

  const { cumulative, cagr } = chainReturns(years.map(y => y.returnPct ?? 0), span)
  return {
    ...base,
    ...extremes,
    cumulativeReturn: cumulative,
    cagr,
    cagrStatus: cagr === null ? 'short' : 'ok',
    totalGain: years.reduce((a, y) => a + y.gain, 0)
  }
}
