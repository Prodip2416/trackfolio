/**
 * Parses the text of a Bangladesh Bank prize bond draw result.
 *
 * The official PDFs are written in the legacy SutonnyMJ font, so the Bangla text
 * comes out as ASCII look-alikes (e.g. "1g cyi¯‹vi" = "১ম পুরস্কার", "120 Zg" = "১২০তম")
 * while digits stay plain ASCII. Unicode Bangla (and Bangla digits) are supported
 * as a fallback in case the bank changes its template.
 *
 * Strategy: locate the five prize headings in order, read the 7-digit numbers and
 * the amount under each, then validate against the standard 1/1/2/2/40 structure.
 */
import { PRIZE_RANKS, STANDARD_PRIZES, STANDARD_TOTAL, decodeSutonnySeries, toAsciiDigits, type PrizeRank } from './core'

export type ParsedPrize = { rank: PrizeRank; amount: number; numbers: string[] }

export type ParseWarning =
  | { code: 'DRAW_NO_NOT_FOUND' }
  | { code: 'DATE_NOT_FOUND' }
  | { code: 'HEADINGS_NOT_FOUND' }
  | { code: 'COUNT_MISMATCH'; rank: PrizeRank; expected: number; found: number }
  | { code: 'TOTAL_MISMATCH'; expected: number; found: number }
  | { code: 'DUPLICATE_NUMBER'; number: string }
  | { code: 'AMOUNT_NOT_FOUND'; rank: PrizeRank }
  | { code: 'SERIES_COUNT_MISMATCH'; expected: number; found: number }

export type ParsedDraw = {
  drawNo: number | null
  drawDate: string | null
  series: string[]
  prizes: ParsedPrize[]
  warnings: ParseWarning[]
  /** true when nothing needs a human look: draw no + date found and exactly the 46 standard numbers. */
  valid: boolean
}

// A bond number: exactly 7 digits not touching other digits. ("10,00,000" has no 7-digit run;
// a following comma is allowed so "0021355, 0164159" yields both.)
const NUMBER_RE = /(?<![\d,])\d{7}(?!\d)(?!,\d{2,3}(?!\d))/g
// Prize heading: "1g cyi¯‹vi", "2q cyi..", "4_© cyi..", or Unicode "১ম পুরস্কার" — and it must be
// followed by its amount ("Uvt 6,00,000/=", ": cÖwZwU 10,000/-") so that mentions of
// "5g cyi¯‹v‡ii" in the intro paragraph are never taken as a heading.
const headingRe = (rank: number) =>
  new RegExp(`(?<!\\d)${rank}\\s*(?:g|q|_©?|ম|য়|র্থ)\\s*(?:cyi|পুরস্কার)(?=[^\\d\\n]{0,40}\\d[\\d,]*\\s*\\/[=-])`, 'g')
// Amount ends with "/=" (most PDFs) or "/-" (draw 124+).
const AMOUNT_RE = /(\d{1,3}(?:,\d{2,3})+|\d{4,})\s*\/[=-]/

function findHeadings(text: string): number[] | null {
  const positions: number[] = []
  let from = 0
  for (const rank of PRIZE_RANKS) {
    const re = headingRe(rank)
    re.lastIndex = from
    const m = re.exec(text)
    if (!m) return null
    positions.push(m.index)
    from = m.index + m[0].length
  }
  return positions
}

// Case-sensitive: SutonnyMJ (after removing the ‡/† vowel-sign glyphs) and Unicode Bangla.
const MONTH_PREFIXES: [string, number][] = [
  ['Rvby', 1], ['deª', 2], ['gvP', 3], ['Gwc', 4], ['Ryb', 6], ['Ryj', 7], ['AvM', 8], ['mÞ', 9], ['A±', 10], ['bf', 11], ['wWm', 12],
  ['জানু', 1], ['ফেব', 2], ['মার্চ', 3], ['এপ্রি', 4], ['মে', 5], ['জুন', 6], ['জুলা', 7], ['আগ', 8], ['সেপ্', 9], ['অক্টো', 10], ['নভে', 11], ['ডিসে', 12]
]
// English month names, compared lower-case and only when nothing above matched.
const ENGLISH_MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

export function monthFromToken(token: string): number | null {
  const t = token.normalize('NFC').replace(/[‡†\s]/g, '')
  if (t === 'g') return 5 // SutonnyMJ "‡g" = মে
  for (const [prefix, month] of MONTH_PREFIXES) {
    if (t.startsWith(prefix)) return month
  }
  const lower = t.toLowerCase()
  const en = ENGLISH_MONTHS.findIndex(m => lower.startsWith(m))
  return en >= 0 ? en + 1 : null
}

function isRealDate(y: number, m: number, d: number) {
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

/** Gregorian draw date: the part after "/" in "16 kÖveY, 1432 e½vã/31 RyjvB, 2025". */
function findDrawDate(text: string): string | null {
  const re = /\/\s*(\d{1,2})\s*([^\s,\d/]+(?:\s[^\s,\d/]+)?)\s*,\s*(\d{4})/g
  for (const m of text.matchAll(re)) {
    const day = Number(m[1])
    const month = monthFromToken(m[2])
    const year = Number(m[3])
    if (month && year >= 1970 && isRealDate(year, month, day)) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }
  return null
}

function findDrawNo(text: string): number | null {
  const m = text.match(/(?<!\d)(\d{1,4})\s*(?:Zg|তম)/)
  return m ? Number(m[1]) : null
}

function findSeries(text: string): { series: string[]; stated: number | null } {
  const stated = text.match(/(\d{2,3})\s*\([^)]*\)\s*wU\s*wmwiR/)
  const start = text.search(/wmwiR\s*h_v/)
  if (start < 0) return { series: [], stated: stated ? Number(stated[1]) : null }
  const rest = text.slice(start)
  const end = rest.search(/GB\s*ÔWª/)
  const section = rest.slice(rest.indexOf('h_v') + 3, end > 0 ? end : 2000)
  const series: string[] = []
  for (const code of section.match(/(?<![A-Za-z_`])[A-Za-z_`]{2}(?![A-Za-z_`])/g) ?? []) {
    const s = decodeSutonnySeries(code)
    if (s && !series.includes(s)) series.push(s)
  }
  return { series, stated: stated ? Number(stated[1]) : null }
}

export function parseDrawText(rawText: string): ParsedDraw {
  const text = toAsciiDigits(rawText.normalize('NFC'))
  const warnings: ParseWarning[] = []

  const drawNo = findDrawNo(text)
  if (drawNo === null) warnings.push({ code: 'DRAW_NO_NOT_FOUND' })
  const drawDate = findDrawDate(text)
  if (!drawDate) warnings.push({ code: 'DATE_NOT_FOUND' })

  const { series, stated } = findSeries(text)
  if (stated !== null && series.length !== stated) {
    warnings.push({ code: 'SERIES_COUNT_MISMATCH', expected: stated, found: series.length })
  }

  let prizes: ParsedPrize[]
  const headings = findHeadings(text)
  if (headings) {
    prizes = PRIZE_RANKS.map((rank, i) => {
      const segment = text.slice(headings[i], headings[i + 1] ?? text.length)
      const amountMatch = segment.match(AMOUNT_RE)
      if (!amountMatch) warnings.push({ code: 'AMOUNT_NOT_FOUND', rank })
      return {
        rank,
        amount: amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : STANDARD_PRIZES[rank].amount,
        numbers: segment.match(NUMBER_RE) ?? []
      }
    })
  } else {
    // No headings: if the 46 numbers are there, assume the standard order.
    warnings.push({ code: 'HEADINGS_NOT_FOUND' })
    const all = text.match(NUMBER_RE) ?? []
    let cursor = 0
    prizes = PRIZE_RANKS.map(rank => {
      const take = all.length === STANDARD_TOTAL ? STANDARD_PRIZES[rank].count : 0
      const numbers = all.slice(cursor, cursor + take)
      cursor += take
      return { rank, amount: STANDARD_PRIZES[rank].amount, numbers }
    })
  }

  for (const p of prizes) {
    const expected = STANDARD_PRIZES[p.rank].count
    if (p.numbers.length !== expected) warnings.push({ code: 'COUNT_MISMATCH', rank: p.rank, expected, found: p.numbers.length })
  }
  const all = prizes.flatMap(p => p.numbers)
  if (all.length !== STANDARD_TOTAL) warnings.push({ code: 'TOTAL_MISMATCH', expected: STANDARD_TOTAL, found: all.length })
  const seen = new Set<string>()
  for (const n of all) {
    if (seen.has(n)) warnings.push({ code: 'DUPLICATE_NUMBER', number: n })
    seen.add(n)
  }

  const blocking = warnings.filter(w => w.code !== 'SERIES_COUNT_MISMATCH' && w.code !== 'AMOUNT_NOT_FOUND')
  return { drawNo, drawDate, series, prizes, warnings, valid: blocking.length === 0 }
}
