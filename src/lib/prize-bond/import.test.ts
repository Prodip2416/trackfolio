import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { extractBondsFromRows, normalizeImportDate, templateRows } from './import'

describe('extractBondsFromRows — with a header row', () => {
  it('uses the named columns; price/year columns are ignored', () => {
    const rows = [
      ['Bond No', 'Price', 'Year', 'Series'],
      ['0622201', 100, 2024, 'কখ'],
      [622202, 100, 2024, ''],
      ['০৬২২২০৩', 100, 2025, 'কগ'],
      ['0622201', 100, 2024, 'কখ'], // duplicate
      ['n/a', 100, 2024, '']
    ]
    expect(extractBondsFromRows(rows)).toEqual({
      items: [
        { number: '0622201', series: 'কখ' },
        { number: '0622202', series: null },
        { number: '0622203', series: 'কগ' }
      ],
      ignored: 1, // n/a
      duplicates: 1,
      columns: ['number', 'series']
    })
  })

  it('reads holder / purchase date / note per row (Bangla headers too)', () => {
    const rows = [
      ['বন্ড নম্বর', 'সিরিজ', 'মালিকের নাম', 'কেনার তারিখ', 'নোট'],
      ['544222', 'কখ', ' Karim ', '15/01/2024', 'gift'],
      ['0000007', '', '', 'not a date', '']
    ]
    const r = extractBondsFromRows(rows)
    expect(r.columns).toEqual(['number', 'series', 'holder', 'purchase_date', 'note'])
    expect(r.items).toEqual([
      { number: '0544222', series: 'কখ', holder: 'Karim', purchase_date: '2024-01-15', note: 'gift' },
      { number: '0000007', series: null, holder: null, purchase_date: null, note: null }
    ])
  })

  it('the downloadable template round-trips through a real .xlsx file', () => {
    const labels = { number: 'Bond Number', series: 'Series (optional, e.g. কখ)', holder: 'Holder (optional)', purchaseDate: 'Purchase Date (YYYY-MM-DD, optional)', note: 'Note (optional)', sampleNote: 'Sample row' }
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(templateRows(labels)), 'Bonds')
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const back = XLSX.read(buf, { cellDates: true })
    const rows = XLSX.utils.sheet_to_json<unknown[]>(back.Sheets[back.SheetNames[0]], { header: 1, raw: true, defval: '' })
    expect(extractBondsFromRows(rows).items).toEqual([
      { number: '0123456', series: 'কখ', holder: 'Karim', purchase_date: '2024-01-15', note: 'Sample row' },
      { number: '0654321', series: null, holder: null, purchase_date: null, note: 'Sample row' }
    ])
  })
})

describe('extractBondsFromRows — no header (any sheet)', () => {
  it('picks the column with most distinct numbers; series from the same row', () => {
    const rows = [
      ['0622201', 100, 2024, 'কখ'],
      [622202, 100, 2024, ''],
      ['০৬২২২০৩', 100, 2025, 'কগ']
    ]
    expect(extractBondsFromRows(rows).items).toEqual([
      { number: '0622201', series: 'কখ' },
      { number: '0622202', series: null },
      { number: '0622203', series: 'কগ' }
    ])
  })

  it('empty / no numbers', () => {
    expect(extractBondsFromRows([])).toEqual({ items: [], ignored: 0, duplicates: 0, columns: [] })
    expect(extractBondsFromRows([['hello'], ['']])).toEqual({ items: [], ignored: 1, duplicates: 0, columns: [] })
  })

  const real = join(process.cwd(), 'sample-pdf', 'Bangladesh Price Bond.xlsx')
  it.skipIf(!existsSync(real))('reads the real client Excel: 200 bonds, leading zeros kept', () => {
    const wb = XLSX.read(readFileSync(real))
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: '' })
    const r = extractBondsFromRows(rows)
    expect(r.items).toHaveLength(200)
    expect(r.items[0]).toEqual({ number: '0622201', series: null })
    expect(r.duplicates).toBe(0)
  })
})

describe('normalizeImportDate', () => {
  it.each([
    ['2024-01-15', '2024-01-15'],
    ['2024/1/5', '2024-01-05'],
    ['15/01/2024', '2024-01-15'],
    ['15-01-2024', '2024-01-15'],
    ['১৫/০১/২০২৪', '2024-01-15'],
    [45306, '2024-01-15'], // Excel serial
    [new Date(2024, 0, 15), '2024-01-15'],
    ['31/02/2024', null],
    ['hello', null],
    ['', null],
    [null, null]
  ])('%s → %s', (v, out) => expect(normalizeImportDate(v)).toBe(out))
})
