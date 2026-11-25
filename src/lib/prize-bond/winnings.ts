/** Pure shaping for the draw check, wins history and summaries (no I/O). */
import { BOND_FACE_VALUE, claimDeadline, compressToRanges, matchBonds, netPrize } from './core'

export type BondInput = {
  id: string
  number: string
  series: string | null
  holder: string | null
  purchase_date: string | null
  encashed_on: string | null
}
export type PrizeInput = { rank: number; amount: number; numbers: string[] }

export type CheckMatch = {
  bond_id: string
  number: string
  series: string | null
  holder: string | null
  rank: number
  gross: number
  net: number
  eligibility: 'ELIGIBLE' | 'TOO_NEW' | 'ENCASHED'
  /** Last day to claim at the bank (draw date + 2 years). */
  deadline: string
}

/** Every bond of the user whose number is among the draw's winning numbers (best prize first). */
export function buildCheckMatches(bonds: BondInput[], prizes: PrizeInput[], drawDate: string): CheckMatch[] {
  const wins = prizes.flatMap(p => p.numbers.map(number => ({ draw_id: 'check', draw_date: drawDate, number, rank: p.rank, amount: p.amount })))
  const deadline = claimDeadline(drawDate)
  return matchBonds(bonds, wins)
    .map(({ bond, win, eligibility }) => ({
      bond_id: bond.id,
      number: bond.number,
      series: bond.series,
      holder: bond.holder,
      rank: win.rank,
      gross: win.amount,
      net: netPrize(win.amount),
      eligibility,
      deadline
    }))
    .sort((a, b) => a.rank - b.rank || a.number.localeCompare(b.number))
}

export type BondSummary = { bondCount: number; activeCount: number; invested: number; ranges: number }

export function summarizeBonds(bonds: Pick<BondInput, 'number' | 'encashed_on'>[]): BondSummary {
  const activeCount = bonds.filter(b => !b.encashed_on).length
  return {
    bondCount: bonds.length,
    activeCount,
    // Money still held in bonds: encashed bonds were paid back at face value.
    invested: activeCount * BOND_FACE_VALUE,
    ranges: compressToRanges(bonds.map(b => b.number)).length
  }
}

export type WinSummary = { count: number; gross: number; net: number }

export function summarizeWins(wins: { amount: number }[]): WinSummary {
  const gross = wins.reduce((s, w) => s + w.amount, 0)
  return { count: wins.length, gross, net: wins.reduce((s, w) => s + netPrize(w.amount), 0) }
}
