import { describe, expect, it } from 'vitest'
import {
  STANDARD_TOTAL,
  claimDeadline,
  compressToRanges,
  daysBetween,
  decodeSutonnySeries,
  eligibility,
  expandBondRange,
  extractBondNumbers,
  matchBonds,
  netPrize,
  normalizeBondNumber,
  normalizeSeries,
  toAsciiDigits
} from './core'

describe('normalizeBondNumber', () => {
  it.each([
    ['0544222', '0544222'],
    ['544222', '0544222'], // leading zero lost (Excel)
    [544222, '0544222'],
    ['০৫৪৪২২২', '0544222'], // Bangla digits
    [' 054-4222 ', '0544222'],
    ['1', '0000001'],
    ['1000000', '1000000'],
    ['12345.0', '0012345'], // Excel/CSV float text — must NOT become 0123450
    ['622201.00', '0622201']
  ])('%s → %s', (input, out) => expect(normalizeBondNumber(input)).toBe(out))

  it.each([['0'], ['0000000'], ['1000001'], ['12345678'], ['abc'], [''], ['05442a2'], [12.5], ['1234.5'], [null], [undefined]])(
    'rejects %s',
    input => expect(normalizeBondNumber(input as string)).toBeNull()
  )
})

describe('extractBondNumbers', () => {
  it('splits, normalises, de-duplicates and reports invalid tokens', () => {
    const r = extractBondNumbers('0622201, 622202\n০৬২২২০৩;0622201 | bad 99999999')
    expect(r.numbers).toEqual(['0622201', '0622202', '0622203'])
    expect(r.duplicates).toBe(1)
    expect(r.invalid).toEqual(['bad', '99999999'])
  })
})

describe('expandBondRange', () => {
  it('expands inclusively with zero padding', () => {
    expect(expandBondRange('0622298', '622300')).toEqual(['0622298', '0622299', '0622300'])
  })
  it('single number range', () => expect(expandBondRange('5', '5')).toEqual(['0000005']))
  it('rejects reversed / invalid / oversize ranges', () => {
    expect(() => expandBondRange('10', '5')).toThrow('RANGE_REVERSED')
    expect(() => expandBondRange('x', '5')).toThrow('INVALID_NUMBER')
    expect(() => expandBondRange('1', '6000')).toThrow('RANGE_TOO_LARGE')
  })
})

describe('compressToRanges', () => {
  it('groups consecutive numbers', () => {
    expect(compressToRanges(['0000003', '0000001', '0000002', '0000010'])).toEqual([
      { from: '0000001', to: '0000003', count: 3 },
      { from: '0000010', to: '0000010', count: 1 }
    ])
  })
})

describe('series', () => {
  it('decodes SutonnyMJ codes from the PDFs', () => {
    expect(decodeSutonnySeries('KK')).toBe('কক')
    expect(decodeSutonnySeries('KL')).toBe('কখ')
    expect(decodeSutonnySeries('K_')).toBe('কথ')
    expect(decodeSutonnySeries('K`')).toBe('কদ')
    expect(decodeSutonnySeries('NN')).toBe('ঘঘ')
    expect(decodeSutonnySeries('K1')).toBeNull()
    expect(decodeSutonnySeries('KKK')).toBeNull()
  })
  it('normalizeSeries accepts two Bangla letters only', () => {
    expect(normalizeSeries(' কখ ')).toBe('কখ')
    expect(normalizeSeries('')).toBeNull()
    expect(normalizeSeries('KL')).toBeNull()
    expect(normalizeSeries('কখগ')).toBeNull()
    expect(normalizeSeries('কড়')).toBe('কড়') // decomposed ড় → NFC
  })
})

describe('dates and rules', () => {
  it('toAsciiDigits', () => expect(toAsciiDigits('১২০তম')).toBe('120তম'))
  it('daysBetween', () => expect(daysBetween('2025-06-01', '2025-07-31')).toBe(60))
  it('claimDeadline = draw + 2 years (leap-day safe)', () => {
    expect(claimDeadline('2025-07-31')).toBe('2027-07-31')
    expect(claimDeadline('2024-02-29')).toBe('2026-02-28')
  })
  it('eligibility: 60-day rule (purchase day counted, draw day not)', () => {
    expect(eligibility({ purchase_date: '2025-06-01', encashed_on: null }, '2025-07-31')).toBe('ELIGIBLE') // 60 days
    expect(eligibility({ purchase_date: '2025-06-02', encashed_on: null }, '2025-07-31')).toBe('TOO_NEW') // 59 days
    expect(eligibility({ purchase_date: null, encashed_on: null }, '2025-07-31')).toBe('ELIGIBLE')
  })
  it('eligibility: encashed before the draw date is out, on/after it is in', () => {
    expect(eligibility({ purchase_date: null, encashed_on: '2025-07-30' }, '2025-07-31')).toBe('ENCASHED')
    expect(eligibility({ purchase_date: null, encashed_on: '2025-07-31' }, '2025-07-31')).toBe('ELIGIBLE')
    expect(eligibility({ purchase_date: null, encashed_on: '2025-08-01' }, '2025-07-31')).toBe('ELIGIBLE')
  })
  it('netPrize deducts 20% tax', () => expect(netPrize(10_000)).toBe(8_000))
  it('standard draw has 46 numbers', () => expect(STANDARD_TOTAL).toBe(46))
})

describe('matchBonds', () => {
  const bonds = [
    { id: 'a', number: '0544222', purchase_date: null, encashed_on: null },
    { id: 'b', number: '0544222', purchase_date: '2025-07-01', encashed_on: null }, // other series, too new
    { id: 'c', number: '0000001', purchase_date: null, encashed_on: null }
  ]
  const wins = [
    { draw_id: 'd120', draw_date: '2025-07-31', number: '0544222', rank: 1, amount: 600000 },
    { draw_id: 'd120', draw_date: '2025-07-31', number: '0241768', rank: 2, amount: 325000 }
  ]
  it('matches every bond with the same number (all series) and flags eligibility', () => {
    const m = matchBonds(bonds, wins)
    expect(m.map(x => [x.bond.id, x.win.rank, x.eligibility])).toEqual([
      ['a', 1, 'ELIGIBLE'],
      ['b', 1, 'TOO_NEW']
    ])
  })
  it('no bonds → no matches', () => expect(matchBonds([], wins)).toEqual([]))
})
