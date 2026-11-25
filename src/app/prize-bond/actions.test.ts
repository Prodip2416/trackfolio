import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// --- mocks (no real DB / auth is touched) ----------------------------------
const h = vi.hoisted(() => {
  const fn = () => vi.fn()
  return {
    user: { id: '11111111-1111-4111-8111-111111111111', email: 'u@example.com' } as { id: string; email: string } | null,
    prisma: {
      profiles: { upsert: fn() },
      prize_bonds: { createMany: fn(), findFirst: fn(), findMany: fn(), updateMany: fn(), deleteMany: fn() },
      prize_bond_wins: { createMany: fn(), deleteMany: fn() }
    }
  }
})
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: h.user } }) } })
}))
vi.mock('@/i18n/getDictionary', async () => {
  const en = (await import('@/i18n/dictionaries/en.json')).default
  return { getDictionary: async () => en }
})
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ default: h.prisma }))

import en from '@/i18n/dictionaries/en.json'
import { addBonds, checkDrawPdf, deleteBonds, deleteWin, updateBond } from './actions'

const E = en.prizeBond.errors
const UID = '11111111-1111-4111-8111-111111111111'
const BOND_ID = '22222222-2222-4222-8222-222222222222'
const WIN_ID = '33333333-3333-4333-8333-333333333333'

const dbBond = (number: string, extra: Record<string, unknown> = {}) => ({
  id: BOND_ID, number, series: null, holder: null, purchase_date: null, encashed_on: null, note: null, created_at: new Date(), ...extra
})

beforeEach(() => {
  vi.clearAllMocks()
  h.user = { id: UID, email: 'u@example.com' }
  h.prisma.prize_bonds.findMany.mockResolvedValue([])
  h.prisma.prize_bond_wins.createMany.mockResolvedValue({ count: 0 })
})

describe('auth', () => {
  it('every action refuses an anonymous user', async () => {
    h.user = null
    expect(await addBonds({ items: [{ number: '1' }] })).toEqual({ error: E.unauthorized })
    expect(await deleteBonds([BOND_ID])).toEqual({ error: E.unauthorized })
    expect(await deleteWin(WIN_ID)).toEqual({ error: E.unauthorized })
    expect(await checkDrawPdf(new FormData())).toEqual({ error: E.unauthorized })
    expect(h.prisma.prize_bonds.createMany).not.toHaveBeenCalled()
  })
})

describe('addBonds', () => {
  it('normalises, de-duplicates, counts invalid and skips existing via skipDuplicates', async () => {
    h.prisma.prize_bonds.createMany.mockResolvedValue({ count: 2 })
    const r = await addBonds({
      items: [{ number: '622201' }, { number: '০৬২২২০২' }, { number: 622203 }, { number: '0622201' }, { number: 'abc' }],
      holder: '  Karim ',
      purchase_date: '2025-01-15'
    })
    expect(r).toEqual({ added: 2, skipped: 1, invalid: 1 })
    const arg = h.prisma.prize_bonds.createMany.mock.calls[0][0]
    expect(arg.skipDuplicates).toBe(true)
    expect(arg.data.map((d: { number: string }) => d.number)).toEqual(['0622201', '0622202', '0622203'])
    expect(arg.data.every((d: { user_id: string; holder: string }) => d.user_id === UID && d.holder === 'Karim')).toBe(true)
  })
  it('per-row series overrides the common series; invalid series is rejected', async () => {
    h.prisma.prize_bonds.createMany.mockResolvedValue({ count: 2 })
    await addBonds({ items: [{ number: '1', series: 'কখ' }, { number: '1' }], series: 'কগ' })
    expect(h.prisma.prize_bonds.createMany.mock.calls[0][0].data.map((d: { series: string }) => d.series)).toEqual(['কখ', 'কগ'])
    expect(await addBonds({ items: [{ number: '1' }], series: 'KL' })).toEqual({ error: E.invalidSeries })
  })
  it('per-row holder / purchase date / note (Excel template) override common values; bad row dates are skipped', async () => {
    h.prisma.prize_bonds.createMany.mockResolvedValue({ count: 2 })
    const r = await addBonds({
      items: [
        { number: '1', holder: 'Karim', purchase_date: '2024-01-15', note: 'gift' },
        { number: '2' },
        { number: '3', purchase_date: '2999-01-01' },
        { number: '4', purchase_date: '2024-02-30' }
      ],
      holder: 'Default'
    })
    expect(r).toEqual({ added: 2, skipped: 0, invalid: 2 })
    const data = h.prisma.prize_bonds.createMany.mock.calls[0][0].data
    expect(data[0]).toMatchObject({ number: '0000001', holder: 'Karim', note: 'gift', purchase_date: new Date('2024-01-15T00:00:00.000Z') })
    expect(data[1]).toMatchObject({ number: '0000002', holder: 'Default', note: null, purchase_date: null })
  })
  it('rejects when nothing is valid, bad and future dates', async () => {
    expect(await addBonds({ items: [{ number: 'x' }] })).toEqual({ error: E.noValidNumbers })
    expect(await addBonds({ items: [{ number: '1' }], purchase_date: '2025-02-30' })).toEqual({ error: E.invalidDate })
    expect(await addBonds({ items: [{ number: '1' }], purchase_date: '2999-01-01' })).toEqual({ error: E.futureDate })
  })
})

describe('updateBond / deleteBonds are scoped to the current user', () => {
  it('update uses id + user_id and reports not found', async () => {
    h.prisma.prize_bonds.findFirst.mockResolvedValue(null)
    h.prisma.prize_bonds.updateMany.mockResolvedValue({ count: 0 })
    expect(await updateBond({ id: BOND_ID, number: '544222' })).toEqual({ error: E.notFound })
    expect(h.prisma.prize_bonds.updateMany.mock.calls[0][0].where).toEqual({ id: BOND_ID, user_id: UID })
    expect(h.prisma.prize_bonds.updateMany.mock.calls[0][0].data.number).toBe('0544222')
  })
  it('update refuses a (number + series) that another bond already has', async () => {
    h.prisma.prize_bonds.findFirst.mockResolvedValue({ id: 'other' })
    expect(await updateBond({ id: BOND_ID, number: '1', series: 'কখ' })).toEqual({ error: E.duplicateBond })
    expect(h.prisma.prize_bonds.updateMany).not.toHaveBeenCalled()
  })
  it('date rules: no future dates, encashed not before purchase', async () => {
    expect(await updateBond({ id: BOND_ID, number: '1', purchase_date: '2999-01-01' })).toEqual({ error: E.futureDate })
    expect(await updateBond({ id: BOND_ID, number: '1', purchase_date: '2025-05-01', encashed_on: '2025-04-01' })).toEqual({
      error: E.encashedBeforePurchase
    })
  })
  it('delete filters by user_id', async () => {
    h.prisma.prize_bonds.deleteMany.mockResolvedValue({ count: 1 })
    expect(await deleteBonds([BOND_ID])).toEqual({ deleted: 1 })
    expect(h.prisma.prize_bonds.deleteMany.mock.calls[0][0].where).toEqual({ id: { in: [BOND_ID] }, user_id: UID })
    expect(await deleteBonds(['not-a-uuid'])).toEqual({ error: E.invalidInput })
  })
})

describe('checkDrawPdf (nothing about the draw is stored)', () => {
  const pdf = (file: string) => {
    const fd = new FormData()
    const bytes = new Uint8Array(readFileSync(join(process.cwd(), 'sample-pdf', file)))
    fd.set('file', new File([bytes as BlobPart], file, { type: 'application/pdf' }))
    return fd
  }

  it('rejects a non-PDF / empty upload', async () => {
    const fd = new FormData()
    fd.set('file', new File([new TextEncoder().encode('hello') as BlobPart], 'a.pdf'))
    expect(await checkDrawPdf(fd)).toEqual({ error: E.invalidPdf })
    expect(await checkDrawPdf(new FormData())).toEqual({ error: E.invalidPdf })
  })

  it('draw 120 + bond 0544222 → 1st prize match, the win is recorded', async () => {
    h.prisma.prize_bonds.findMany.mockResolvedValue([dbBond('0544222', { series: 'কখ', holder: 'Karim' }), dbBond('0000001')])
    h.prisma.prize_bond_wins.createMany.mockResolvedValue({ count: 1 })
    const r = await checkDrawPdf(pdf('120thdraw.pdf'))
    if ('error' in r) throw new Error(r.error)
    expect(r).toMatchObject({ drawNo: 120, drawDate: '2025-07-31', valid: true, checkedCount: 2, recorded: 1, notRecordedReason: null })
    expect(r.matches).toEqual([
      expect.objectContaining({ number: '0544222', series: 'কখ', rank: 1, gross: 600000, net: 480000, eligibility: 'ELIGIBLE', deadline: '2027-07-31' })
    ])
    const arg = h.prisma.prize_bond_wins.createMany.mock.calls[0][0]
    expect(arg.skipDuplicates).toBe(true)
    expect(arg.data).toEqual([
      expect.objectContaining({ user_id: UID, bond_id: BOND_ID, number: '0544222', series: 'কখ', holder: 'Karim', draw_no: 120, rank: 1, amount: 600000 })
    ])
  })

  it('draw 125 with no matching bond → no match, nothing written', async () => {
    h.prisma.prize_bonds.findMany.mockResolvedValue([dbBond('0622201')])
    const r = await checkDrawPdf(pdf('125thdraw.pdf'))
    if ('error' in r) throw new Error(r.error)
    expect(r).toMatchObject({ drawNo: 125, valid: true, checkedCount: 1, matches: [], recorded: 0 })
    expect(r.prizes.flatMap(p => p.numbers)).toHaveLength(46)
    expect(h.prisma.prize_bond_wins.createMany).not.toHaveBeenCalled()
  })

  it('a bond bought < 60 days before the draw is shown but not recorded', async () => {
    h.prisma.prize_bonds.findMany.mockResolvedValue([dbBond('0544222', { purchase_date: new Date('2025-07-01T00:00:00Z') })])
    const r = await checkDrawPdf(pdf('120thdraw.pdf'))
    if ('error' in r) throw new Error(r.error)
    expect(r.matches[0].eligibility).toBe('TOO_NEW')
    expect(r.recorded).toBe(0)
    expect(h.prisma.prize_bond_wins.createMany).not.toHaveBeenCalled()
  })
})

describe('deleteWin', () => {
  it('is scoped to the user', async () => {
    h.prisma.prize_bond_wins.deleteMany.mockResolvedValue({ count: 1 })
    expect(await deleteWin(WIN_ID)).toEqual({ success: true })
    expect(h.prisma.prize_bond_wins.deleteMany.mock.calls[0][0].where).toEqual({ id: WIN_ID, user_id: UID })
    h.prisma.prize_bond_wins.deleteMany.mockResolvedValue({ count: 0 })
    expect(await deleteWin(WIN_ID)).toEqual({ error: E.notFound })
    expect(await deleteWin('nope')).toEqual({ error: E.invalidInput })
  })
})
