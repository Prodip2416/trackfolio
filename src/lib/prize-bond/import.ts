import { normalizeBondNumber, normalizeSeries, toAsciiDigits } from './core'

export type ImportedBond = {
  number: string
  series: string | null
  holder?: string | null
  purchase_date?: string | null
  note?: string | null
}
export type ImportColumn = 'number' | 'series' | 'holder' | 'purchase_date' | 'note'
export type ImportResult = {
  items: ImportedBond[]
  ignored: number
  duplicates: number
  /** Columns recognised from a header row (empty = no header, numbers detected heuristically). */
  columns: ImportColumn[]
}

const isBlank = (v: unknown) => v === null || v === undefined || String(v).trim() === ''

// Header names (English + Bangla) accepted for each column of the template.
const HEADER_PATTERNS: [ImportColumn, RegExp][] = [
  ['number', /bond|number|^no\.?$|নম্বর|নং/i],
  ['series', /series|সিরিজ/i],
  ['holder', /holder|owner|name|মালিক|নাম/i],
  ['purchase_date', /purchase|date|কেনা|তারিখ/i],
  ['note', /note|remark|নোট|মন্তব্য/i]
]

/** Finds a header row (in the first 5 rows) that names at least the bond-number column. */
function findHeader(rows: unknown[][]): { row: number; map: Partial<Record<ImportColumn, number>> } | null {
  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const map: Partial<Record<ImportColumn, number>> = {}
    rows[r].forEach((cell, col) => {
      if (typeof cell !== 'string' || !cell.trim() || isCellNumber(cell)) return
      const hit = HEADER_PATTERNS.find(([key, re]) => map[key] === undefined && re.test(cell.trim()))
      if (hit) map[hit[0]] = col
    })
    if (map.number !== undefined) return { row: r, map }
  }
  return null
}

const pad = (n: number) => String(n).padStart(2, '0')
const isReal = (y: number, m: number, d: number) => {
  const dt = new Date(Date.UTC(y, m - 1, d))
  return y >= 1970 && dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

/** Excel Date / serial number / "YYYY-MM-DD" / "DD/MM/YYYY" / "DD-MM-YYYY" → "YYYY-MM-DD", else null. */
export function normalizeImportDate(v: unknown): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`
  }
  if (typeof v === 'number' && v > 20000 && v < 80000) {
    // Excel serial date (days since 1899-12-30)
    const dt = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86_400_000)
    return dt.toISOString().slice(0, 10)
  }
  if (typeof v !== 'string') return null
  const s = toAsciiDigits(v.trim())
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
  if (m && isReal(+m[1], +m[2], +m[3])) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
  if (m && isReal(+m[3], +m[2], +m[1])) return `${m[3]}-${pad(+m[2])}-${pad(+m[1])}`
  return null
}

const text = (v: unknown, max: number) => (isBlank(v) ? null : String(v).trim().slice(0, max))

/**
 * Picks bond numbers out of spreadsheet rows (first sheet, as an array of rows).
 *
 * - With a header row (like the downloadable template) the named columns are used,
 *   including holder / purchase date / note per row.
 * - Without a header, only the ONE column with the most distinct valid bond numbers is
 *   used, so unrelated numeric columns (price, quantity, year…) are never imported.
 *   A two-letter Bangla series anywhere in the same row becomes that bond's series.
 */
export function extractBondsFromRows(rows: unknown[][]): ImportResult {
  const header = findHeader(rows)
  let numberCol: number
  let body = rows
  if (header) {
    numberCol = header.map.number!
    body = rows.slice(header.row + 1)
  } else {
    const distinct = new Map<number, Set<string>>()
    for (const row of rows) {
      row.forEach((cell, col) => {
        if (!isCellNumber(cell)) return
        if (!distinct.has(col)) distinct.set(col, new Set())
        distinct.get(col)!.add(normalizeBondNumber(cell as string | number)!)
      })
    }
    if (distinct.size === 0) return { items: [], ignored: rows.filter(r => r.some(c => !isBlank(c))).length, duplicates: 0, columns: [] }
    numberCol = [...distinct.entries()].sort((a, b) => b[1].size - a[1].size || a[0] - b[0])[0][0]
  }

  const items: ImportedBond[] = []
  const seen = new Set<string>()
  let ignored = 0
  let duplicates = 0
  for (const row of body) {
    const cell = row[numberCol]
    if (isBlank(cell)) continue
    const number = isCellNumber(cell) ? normalizeBondNumber(cell as string | number) : null
    if (!number) {
      ignored++ // header text, junk, out-of-range
      continue
    }
    const series =
      header?.map.series !== undefined
        ? typeof row[header.map.series] === 'string'
          ? normalizeSeries(row[header.map.series] as string)
          : null
        : (row.map(c => (typeof c === 'string' ? normalizeSeries(c) : null)).find(Boolean) ?? null)
    const key = `${number}:${series ?? ''}`
    if (seen.has(key)) {
      duplicates++
      continue
    }
    seen.add(key)
    const item: ImportedBond = { number, series }
    if (header) {
      const { holder, purchase_date, note } = header.map
      if (holder !== undefined) item.holder = text(row[holder], 100)
      if (purchase_date !== undefined) item.purchase_date = normalizeImportDate(row[purchase_date])
      if (note !== undefined) item.note = text(row[note], 500)
    }
    items.push(item)
  }
  const columns = header ? (Object.keys(header.map) as ImportColumn[]) : []
  return { items, ignored, duplicates, columns }
}

function isCellNumber(cell: unknown): boolean {
  if (typeof cell === 'number') return normalizeBondNumber(cell) !== null
  if (typeof cell === 'string') return /^\s*[\d০-৯][\d০-৯\s-]*(\.0+)?\s*$/.test(cell) && normalizeBondNumber(cell) !== null
  return false
}

// ---------------------------------------------------------------------------
// Downloadable template (rows for sheet 1). Numbers are TEXT so leading zeros stay.
// ---------------------------------------------------------------------------

export type TemplateLabels = { number: string; series: string; holder: string; purchaseDate: string; note: string; sampleNote: string }

export function templateRows(l: TemplateLabels): string[][] {
  return [
    [l.number, l.series, l.holder, l.purchaseDate, l.note],
    ['0123456', 'কখ', 'Karim', '2024-01-15', l.sampleNote],
    ['0654321', '', '', '', l.sampleNote]
  ]
}
