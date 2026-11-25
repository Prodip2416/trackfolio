/**
 * Prize Bond domain rules (pure, no I/O) — Bangladesh 100 Taka prize bond.
 *
 * - A bond number is 7 digits with leading zeros, 0000001..1000000.
 * - Every draw announces 46 numbers (1+1+2+2+40) that win in EVERY series,
 *   so matching uses the 7-digit number only.
 * - A bond takes part in a draw only if it was bought at least 60 days before
 *   it (purchase date counted, draw date not counted).
 * - A prize must be claimed within 2 years of the draw; 20% tax is deducted at source.
 */

export const BOND_FACE_VALUE = 100
export const MAX_BOND_NUMBER = 1_000_000
export const ELIGIBILITY_DAYS = 60
export const CLAIM_YEARS = 2
export const PRIZE_TAX_RATE = 0.2
/** Safety cap for a single add/import/range operation. */
export const MAX_BONDS_PER_OPERATION = 5000

export const PRIZE_RANKS = [1, 2, 3, 4, 5] as const
export type PrizeRank = (typeof PRIZE_RANKS)[number]

/** Standard prize structure (per series). Amounts are only a fallback — the PDF's amounts win. */
export const STANDARD_PRIZES: Record<PrizeRank, { count: number; amount: number }> = {
  1: { count: 1, amount: 600_000 },
  2: { count: 1, amount: 325_000 },
  3: { count: 2, amount: 100_000 },
  4: { count: 2, amount: 50_000 },
  5: { count: 40, amount: 10_000 }
}
export const STANDARD_TOTAL = PRIZE_RANKS.reduce((s, r) => s + STANDARD_PRIZES[r].count, 0) // 46

const BN_DIGITS = '০১২৩৪৫৬৭৮৯'

/** Bangla digits → ASCII digits; leaves everything else untouched. */
export function toAsciiDigits(s: string): string {
  return s.replace(/[০-৯]/g, d => String(BN_DIGITS.indexOf(d)))
}

/**
 * Normalises one user-typed / Excel bond number to the canonical 7-digit form.
 * Accepts Bangla digits, spaces, dashes and numbers that lost their leading zeros
 * (Excel numeric cells). Returns null when it is not a valid bond number.
 */
export function normalizeBondNumber(raw: string | number | null | undefined): string | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') {
    if (!Number.isInteger(raw)) return null
    raw = String(raw)
  }
  // "12345.0" (Excel/CSV float) → "12345"; any other "." is not a separator, so it stays and fails.
  const digits = toAsciiDigits(String(raw))
    .trim()
    .replace(/\.0+$/, '')
    .replace(/[\s\-_,]/g, '')
  if (!/^\d{1,7}$/.test(digits)) return null
  const n = Number(digits)
  if (n < 1 || n > MAX_BOND_NUMBER) return null
  return digits.padStart(7, '0')
}

export type ExtractResult = { numbers: string[]; invalid: string[]; duplicates: number }

/**
 * Pulls every bond number out of free text (paste box, CSV). Tokens are split on
 * whitespace, commas, semicolons and pipes. Keeps first-seen order, de-duplicates.
 */
export function extractBondNumbers(text: string): ExtractResult {
  const seen = new Set<string>()
  const numbers: string[] = []
  const invalid: string[] = []
  let duplicates = 0
  for (const token of toAsciiDigits(text).split(/[\s,;|]+/)) {
    const t = token.trim()
    if (!t) continue
    const n = normalizeBondNumber(t)
    if (!n) {
      invalid.push(t)
      continue
    }
    if (seen.has(n)) duplicates++
    else {
      seen.add(n)
      numbers.push(n)
    }
  }
  return { numbers, invalid, duplicates }
}

/** Inclusive range "from..to" → canonical numbers. Throws on invalid / oversize ranges. */
export function expandBondRange(from: string, to: string, max = MAX_BONDS_PER_OPERATION): string[] {
  const a = normalizeBondNumber(from)
  const b = normalizeBondNumber(to)
  if (!a || !b) throw new Error('INVALID_NUMBER')
  const start = Number(a)
  const end = Number(b)
  if (end < start) throw new Error('RANGE_REVERSED')
  if (end - start + 1 > max) throw new Error('RANGE_TOO_LARGE')
  const out: string[] = []
  for (let n = start; n <= end; n++) out.push(String(n).padStart(7, '0'))
  return out
}

/** Collapses sorted numbers into "0622201–0622300" style ranges for compact display. */
export function compressToRanges(numbers: string[]): { from: string; to: string; count: number }[] {
  const sorted = [...new Set(numbers)].sort()
  const out: { from: string; to: string; count: number }[] = []
  for (const n of sorted) {
    const last = out[out.length - 1]
    if (last && Number(n) === Number(last.to) + 1) {
      last.to = n
      last.count++
    } else out.push({ from: n, to: n, count: 1 })
  }
  return out
}

// ---------------------------------------------------------------------------
// Series (two Bangla letters, e.g. "কখ")
// ---------------------------------------------------------------------------

/** SutonnyMJ (legacy ASCII font) letter → Unicode Bangla consonant, as used in the BB PDFs. */
export const SUTONNY_SERIES_LETTERS: Record<string, string> = {
  K: 'ক', L: 'খ', M: 'গ', N: 'ঘ', O: 'ঙ', P: 'চ', Q: 'ছ', R: 'জ', S: 'ঝ', T: 'ঞ',
  U: 'ট', V: 'ঠ', W: 'ড', X: 'ঢ', Y: 'ণ', Z: 'ত', _: 'থ', '`': 'দ', a: 'ধ', b: 'ন',
  c: 'প', d: 'ফ', e: 'ব', f: 'ভ', g: 'ম', h: 'য', i: 'র', j: 'ল', k: 'শ', l: 'ষ',
  m: 'স', n: 'হ'
}

/** Decodes a 2-char SutonnyMJ series code ("KL" → "কখ"); null if any char is unknown. */
export function decodeSutonnySeries(code: string): string | null {
  if (code.length !== 2) return null
  const a = SUTONNY_SERIES_LETTERS[code[0]]
  const b = SUTONNY_SERIES_LETTERS[code[1]]
  return a && b ? a + b : null
}

/** A valid series is exactly two Bangla consonants. Trims whitespace; '' → null. */
export function normalizeSeries(raw: string | null | undefined): string | null {
  const s = (raw ?? '').normalize('NFC').replace(/\s+/g, '')
  if (!s) return null
  // Consonant (optionally + nukta U+09BC, for decomposed ড়/ঢ়/য়) twice.
  return /^(?:[ক-হৎড়-য়]়?){2}$/.test(s) ? s : null
}

// ---------------------------------------------------------------------------
// Dates (ISO yyyy-mm-dd strings, UTC arithmetic — no timezone drift)
// ---------------------------------------------------------------------------

const DAY_MS = 86_400_000
const isoToUtc = (iso: string) => Date.parse(`${iso}T00:00:00Z`)

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((isoToUtc(toIso) - isoToUtc(fromIso)) / DAY_MS)
}

/** Last day the prize of a draw can be claimed (draw date + 2 years). */
export function claimDeadline(drawDateIso: string): string {
  const [y, m, d] = drawDateIso.split('-').map(Number)
  const dt = new Date(Date.UTC(y + CLAIM_YEARS, m - 1, d))
  // 29 Feb + 2y → JS rolls to 1 Mar; keep it on 28 Feb instead.
  if (dt.getUTCMonth() !== m - 1) dt.setUTCDate(0)
  return dt.toISOString().slice(0, 10)
}

export type BondForMatch = { purchase_date: string | null; encashed_on: string | null }

/**
 * Whether a bond takes part in a draw.
 * - Unknown purchase date → assumed eligible.
 * - Bought < 60 days before the draw → not eligible.
 * - Encashed BEFORE the draw date → not eligible (encashed on the draw day still counts,
 *   so a user never silently loses a possibly valid win).
 */
export function eligibility(bond: BondForMatch, drawDateIso: string): 'ELIGIBLE' | 'TOO_NEW' | 'ENCASHED' {
  if (bond.encashed_on && bond.encashed_on < drawDateIso) return 'ENCASHED'
  if (bond.purchase_date && daysBetween(bond.purchase_date, drawDateIso) < ELIGIBILITY_DAYS) return 'TOO_NEW'
  return 'ELIGIBLE'
}

export const netPrize = (gross: number) => Math.round(gross * (1 - PRIZE_TAX_RATE))

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

export type MatchBond = BondForMatch & { id: string; number: string }
export type MatchWinning = { draw_id: string; draw_date: string; number: string; rank: number; amount: number }
export type Match<B extends MatchBond, W extends MatchWinning> = {
  bond: B
  win: W
  eligibility: ReturnType<typeof eligibility>
}

/** Every (bond, winning number) pair with the same 7-digit number, eligible or not. */
export function matchBonds<B extends MatchBond, W extends MatchWinning>(bonds: B[], wins: W[]): Match<B, W>[] {
  const byNumber = new Map<string, B[]>()
  for (const b of bonds) {
    const list = byNumber.get(b.number)
    if (list) list.push(b)
    else byNumber.set(b.number, [b])
  }
  const out: Match<B, W>[] = []
  for (const w of wins) {
    for (const bond of byNumber.get(w.number) ?? []) {
      out.push({ bond, win: w, eligibility: eligibility(bond, w.draw_date) })
    }
  }
  return out.sort((x, y) => (x.win.draw_date === y.win.draw_date ? x.win.rank - y.win.rank : y.win.draw_date.localeCompare(x.win.draw_date)))
}
