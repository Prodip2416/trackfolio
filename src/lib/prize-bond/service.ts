/** Server-side data loading for the Prize Bond module (Prisma). */
import prisma from '@/lib/prisma'
import { claimDeadline, netPrize } from './core'
import { summarizeBonds, type BondSummary } from './winnings'

export const isoDate = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null)
export const dbDate = (s: string | null | undefined): Date | null => (s ? new Date(`${s}T00:00:00.000Z`) : null)

export type BondRow = {
  id: string
  number: string
  series: string | null
  holder: string | null
  purchase_date: string | null
  encashed_on: string | null
  note: string | null
  created_at: string
}

export async function loadBonds(userId: string): Promise<BondRow[]> {
  const rows = await prisma.prize_bonds.findMany({
    where: { user_id: userId },
    orderBy: [{ number: 'asc' }, { series: 'asc' }]
  })
  return rows.map(b => ({
    id: b.id,
    number: b.number,
    series: b.series,
    holder: b.holder,
    purchase_date: isoDate(b.purchase_date),
    encashed_on: isoDate(b.encashed_on),
    note: b.note,
    created_at: b.created_at.toISOString()
  }))
}

export type WinRow = {
  id: string
  number: string
  series: string | null
  holder: string | null
  draw_no: number
  draw_date: string
  rank: number
  gross: number
  net: number
  deadline: string
  found_at: string
}

/** The user's win history (newest draw first). */
export async function loadWins(userId: string): Promise<WinRow[]> {
  const rows = await prisma.prize_bond_wins.findMany({
    where: { user_id: userId },
    orderBy: [{ draw_no: 'desc' }, { rank: 'asc' }, { number: 'asc' }]
  })
  return rows.map(w => {
    const drawDate = isoDate(w.draw_date)!
    const gross = Number(w.amount)
    return {
      id: w.id,
      number: w.number,
      series: w.series,
      holder: w.holder,
      draw_no: w.draw_no,
      draw_date: drawDate,
      rank: w.rank,
      gross,
      net: netPrize(gross),
      deadline: claimDeadline(drawDate),
      found_at: w.created_at.toISOString()
    }
  })
}

export async function getBondSummary(userId: string): Promise<BondSummary> {
  const bonds = await prisma.prize_bonds.findMany({ where: { user_id: userId }, select: { number: true, encashed_on: true } })
  return summarizeBonds(bonds.map(b => ({ number: b.number, encashed_on: isoDate(b.encashed_on) })))
}
