import { describe, expect, it } from 'vitest'
import { buildCheckMatches, summarizeBonds, summarizeWins, type BondInput, type PrizeInput } from './winnings'

const bond = (id: string, number: string, extra: Partial<BondInput> = {}): BondInput => ({
  id, number, series: null, holder: null, purchase_date: null, encashed_on: null, ...extra
})

// Draw 120 (31 Jul 2025), trimmed.
const prizes: PrizeInput[] = [
  { rank: 1, amount: 600000, numbers: ['0544222'] },
  { rank: 2, amount: 325000, numbers: ['0241768'] },
  { rank: 5, amount: 10000, numbers: ['0006754', '0193354'] }
]

describe('buildCheckMatches', () => {
  it('matches all series of a number, best prize first, with net + deadline', () => {
    const bonds = [
      bond('x', '0193354'),
      bond('a', '0544222', { series: 'কখ', holder: 'Karim' }),
      bond('b', '0544222', { series: 'কগ' }),
      bond('c', '0000001')
    ]
    const m = buildCheckMatches(bonds, prizes, '2025-07-31')
    expect(m.map(x => [x.bond_id, x.rank])).toEqual([['a', 1], ['b', 1], ['x', 5]])
    expect(m[0]).toMatchObject({ number: '0544222', series: 'কখ', holder: 'Karim', gross: 600000, net: 480000, deadline: '2027-07-31', eligibility: 'ELIGIBLE' })
  })
  it('flags bonds bought < 60 days before / encashed before the draw', () => {
    const m = buildCheckMatches(
      [bond('n', '0241768', { purchase_date: '2025-07-01' }), bond('e', '0006754', { encashed_on: '2025-07-01' })],
      prizes,
      '2025-07-31'
    )
    expect(Object.fromEntries(m.map(x => [x.bond_id, x.eligibility]))).toEqual({ n: 'TOO_NEW', e: 'ENCASHED' })
  })
  it('no bonds or no match → empty', () => {
    expect(buildCheckMatches([], prizes, '2025-07-31')).toEqual([])
    expect(buildCheckMatches([bond('c', '0000001')], prizes, '2025-07-31')).toEqual([])
  })
})

describe('summaries', () => {
  it('summarizeBonds: invested counts only active bonds; serial ranges', () => {
    expect(
      summarizeBonds([
        { number: '0000001', encashed_on: null },
        { number: '0000002', encashed_on: null },
        { number: '0000010', encashed_on: '2025-01-01' }
      ])
    ).toEqual({ bondCount: 3, activeCount: 2, invested: 200, ranges: 2 })
    expect(summarizeBonds([])).toEqual({ bondCount: 0, activeCount: 0, invested: 0, ranges: 0 })
  })
  it('summarizeWins: gross and net (20% tax)', () => {
    expect(summarizeWins([{ amount: 600000 }, { amount: 10000 }])).toEqual({ count: 2, gross: 610000, net: 488000 })
  })
})
