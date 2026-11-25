import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseDrawText, monthFromToken } from './parse-draw'
import { extractPdfText, itemsToLines } from './pdf-text'
import expected from './__fixtures__/draws.expected.json'

const SAMPLE_DIR = join(process.cwd(), 'sample-pdf')

// Oracle: draws.expected.json was produced independently with poppler's `pdftotext`.
describe('real Bangladesh Bank PDFs (draw 117–125)', () => {
  for (const [file, exp] of Object.entries(expected)) {
    it(`${file} → draw ${exp.drawNo}, 46 numbers exact`, async () => {
      const text = await extractPdfText(new Uint8Array(readFileSync(join(SAMPLE_DIR, file))))
      const r = parseDrawText(text)

      expect(r.warnings).toEqual([])
      expect(r.valid).toBe(true)
      expect(r.drawNo).toBe(exp.drawNo)
      expect(r.drawDate).toBe(exp.drawDate)
      expect(r.series).toHaveLength(exp.seriesCount)
      expect(r.series[0]).toBe('কক')
      expect(r.prizes.map(p => p.amount)).toEqual([600000, 325000, 100000, 50000, 10000])
      for (const p of r.prizes) {
        expect([...p.numbers].sort(), `rank ${p.rank}`).toEqual(exp.ranks[String(p.rank) as keyof typeof exp.ranks])
      }
    })
  }
})

describe('parseDrawText edge cases', () => {
  const nums = (n: number, start: number) => Array.from({ length: n }, (_, i) => String(start + i).padStart(7, '0'))
  const unicodeDoc = (fifth: string[]) =>
    [
      '১০০/- টাকা মূল্যমান বাংলাদেশ প্রাইজবন্ডের ১২০তম ড্র-এর ফলাফল',
      'অদ্য ১৬ শ্রাবণ, ১৪৩২ বঙ্গাব্দ/৩১ জুলাই, ২০২৫ তারিখে',
      'উক্ত ড্র-তে ০০০০০০১ হইতে ১০,০০,০০০ ক্রম সংখ্যার',
      '১ম পুরস্কার টাঃ ৬,০০,০০০/= ০৫৪৪২২২',
      '২য় পুরস্কার টাঃ ৩,২৫,০০০/= ০২৪১৭৬৮',
      '৩য় পুরস্কার: প্রতিটি ১,০০,০০০/= টাকার; ০৫৫৩৮৪৫ ০৯৬৪০৫২',
      '৪র্থ পুরস্কার: প্রতিটি ৫০,০০০/= টাকার; ০০৫৪৩৮২ ০১৯৭১৪২',
      '৫ম পুরস্কার: প্রতিটি ১০,০০০/= টাকার; ' + fifth.join(' ')
    ].join('\n')

  it('parses a Unicode Bangla / Bangla-digit document and ignores 0000001 / 10,00,000 in the preamble', () => {
    const r = parseDrawText(unicodeDoc(nums(40, 100)))
    expect(r.drawNo).toBe(120)
    expect(r.drawDate).toBe('2025-07-31')
    expect(r.prizes[0].numbers).toEqual(['0544222'])
    expect(r.prizes[4].numbers).toHaveLength(40)
    expect(r.valid).toBe(true)
  })

  it('flags count mismatch and duplicates as not valid', () => {
    const r = parseDrawText(unicodeDoc([...nums(38, 100), '0544222']))
    expect(r.valid).toBe(false)
    expect(r.warnings).toContainEqual({ code: 'COUNT_MISMATCH', rank: 5, expected: 40, found: 39 })
    expect(r.warnings).toContainEqual({ code: 'DUPLICATE_NUMBER', number: '0544222' })
  })

  it('falls back to standard order when headings are missing but 46 numbers exist', () => {
    const r = parseDrawText(`125Zg ÔWª /01 b‡f¤^i, 2026\n${nums(46, 5000).join(' ')}`)
    expect(r.warnings).toEqual([{ code: 'HEADINGS_NOT_FOUND' }])
    expect(r.prizes.map(p => p.numbers.length)).toEqual([1, 1, 2, 2, 40])
    expect(r.valid).toBe(false) // a human must confirm
  })

  it('keeps numbers that are followed by a comma', () => {
    const r = parseDrawText(unicodeDoc([...nums(39, 100).map(n => n + ','), '0009999']))
    expect(r.prizes[4].numbers).toHaveLength(40)
    expect(r.valid).toBe(true)
  })

  it('ignores prize mentions in the intro that have no amount (e.g. "1g cyi¯‹v‡ii")', () => {
    const intro = 'cÖ_g 1g cyi¯‹v‡ii Rb¨ 0000001 nB‡Z 10,00,000 ... 2q, 3q, 4_© I 5g cyi¯‹v‡ii Rb¨ †NvwlZ\n'
    const r = parseDrawText(intro + unicodeDoc(nums(40, 100)))
    expect(r.prizes[0].numbers).toEqual(['0544222'])
    expect(r.prizes[0].amount).toBe(600000)
    expect(r.valid).toBe(true)
  })

  it('reports missing draw no / date and empty text', () => {
    const r = parseDrawText('nothing here')
    expect(r.drawNo).toBeNull()
    expect(r.drawDate).toBeNull()
    expect(r.valid).toBe(false)
  })

  it.each([
    ['Rvbyqvwi', 1], ['‡deªæqvwi', 2], ['gvP©', 3], ['GwcÖj', 4], ['‡g', 5], ['Ryb', 6], ['RyjvB', 7],
    ['AvM÷', 8], ['‡m‡Þ¤^i', 9], ['A‡±vei', 10], ['b‡f¤^i', 11], ['wW‡m¤^i', 12], ['জুলাই', 7], ['October', 10], ['December', 12], ['Dec', 12], ['February', 2], ['xyz', null]
  ])('month %s → %s', (tok, m) => expect(monthFromToken(tok)).toBe(m))
})

describe('itemsToLines', () => {
  it('glues touching runs (split number) and spaces separated ones', () => {
    const lines = itemsToLines([
      { str: '054', x: 100, y: 500, w: 15 },
      { str: '4222', x: 115, y: 501, w: 20 },
      { str: '0241768', x: 200, y: 500, w: 35 },
      { str: 'top', x: 0, y: 700, w: 10 }
    ])
    expect(lines).toEqual(['top', '0544222 0241768'])
  })
})
