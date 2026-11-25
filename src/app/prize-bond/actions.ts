'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { getDictionary } from '@/i18n/getDictionary'
import { isRealIsoDate, todayInDhaka } from '@/lib/date'
import { MAX_BONDS_PER_OPERATION, normalizeBondNumber, normalizeSeries } from '@/lib/prize-bond/core'
import { parseDrawText, type ParsedDraw } from '@/lib/prize-bond/parse-draw'
import { extractPdfText } from '@/lib/prize-bond/pdf-text'
import { fmt, type PrizeBondDict } from '@/lib/prize-bond/i18n'
import { buildCheckMatches, type CheckMatch } from '@/lib/prize-bond/winnings'
import { dbDate, loadBonds } from '@/lib/prize-bond/service'

// Vercel caps a function request body at 4.5 MB (multipart overhead included), so stay below it.
// Bangladesh Bank result PDFs are ~100–260 KB.
const MAX_PDF_BYTES = 4 * 1024 * 1024

type Fail = { error: string }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function ctx(): Promise<{ user: { id: string; email?: string | null } | null; t: PrizeBondDict }> {
  const supabase = await createClient()
  const [{ data: { user } }, dict] = await Promise.all([supabase.auth.getUser(), getDictionary()])
  return { user, t: dict.prizeBond }
}

async function ensureProfile(user: { id: string; email?: string | null }) {
  await prisma.profiles.upsert({ where: { id: user.id }, update: {}, create: { id: user.id, email: user.email ?? null } })
}

function revalidatePrizeBond() {
  revalidatePath('/prize-bond', 'layout')
  revalidatePath('/')
}

const isUniqueViolation = (e: unknown) => typeof e === 'object' && e !== null && (e as { code?: string }).code === 'P2002'

const optText = (max: number) =>
  z
    .string()
    .nullish()
    .transform(v => (v && v.trim() ? v.trim().slice(0, max) : null))

const optDate = z
  .string()
  .nullish()
  .transform(v => (v ? v : null))
  .refine(v => v === null || isRealIsoDate(v), { message: 'date' })

const optSeries = z
  .string()
  .nullish()
  .transform(v => (v && v.trim() ? v : null))
  .refine(v => v === null || normalizeSeries(v) !== null, { message: 'series' })
  .transform(v => (v === null ? null : normalizeSeries(v)))

/** Maps a zod issue to a localized message. */
function zodError(t: PrizeBondDict, error: z.ZodError): string {
  const msg = error.issues[0]?.message
  if (msg === 'series') return t.errors.invalidSeries
  if (msg === 'date') return t.errors.invalidDate
  if (msg === 'number') return t.errors.invalidNumber
  return t.errors.invalidInput
}

// ---------------------------------------------------------------------------
// Bonds
// ---------------------------------------------------------------------------

const addSchema = z.object({
  // Per-row holder / purchase_date / note (Excel template) override the common values.
  items: z
    .array(
      z.object({
        number: z.union([z.string(), z.number()]),
        series: z.string().nullish(),
        holder: z.string().max(200).nullish(),
        purchase_date: z.string().max(20).nullish(),
        note: z.string().max(1000).nullish()
      })
    )
    .max(MAX_BONDS_PER_OPERATION * 2),
  series: optSeries,
  holder: optText(100),
  purchase_date: optDate,
  note: optText(500)
})

export type AddBondsResult = { added: number; skipped: number; invalid: number }

/** Adds many bonds; existing (number + series) pairs are skipped, not overwritten. */
export async function addBonds(input: z.input<typeof addSchema>): Promise<AddBondsResult | Fail> {
  const { user, t } = await ctx()
  if (!user) return { error: t.errors.unauthorized }
  const parsed = addSchema.safeParse(input)
  if (!parsed.success) return { error: zodError(t, parsed.error) }
  const { items, series, holder, purchase_date, note } = parsed.data
  const today = todayInDhaka()
  if (purchase_date && purchase_date > today) return { error: t.errors.futureDate }

  let invalid = 0
  const seen = new Set<string>()
  type Row = { number: string; series: string | null; holder: string | null; purchase_date: string | null; note: string | null }
  const rows: Row[] = []
  for (const it of items) {
    const number = normalizeBondNumber(it.number)
    const rowSeries = it.series ? normalizeSeries(it.series) : series
    const rowDate = it.purchase_date || purchase_date
    // A row with a bad series or an invalid / future purchase date is skipped, not guessed.
    if (!number || (it.series && !rowSeries) || (rowDate && (!isRealIsoDate(rowDate) || rowDate > today))) {
      invalid++
      continue
    }
    const key = `${number}:${rowSeries ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    rows.push({
      number,
      series: rowSeries,
      holder: it.holder?.trim() ? it.holder.trim().slice(0, 100) : holder,
      purchase_date: rowDate,
      note: it.note?.trim() ? it.note.trim().slice(0, 500) : note
    })
  }
  if (rows.length === 0) return { error: t.errors.noValidNumbers }
  if (rows.length > MAX_BONDS_PER_OPERATION) return { error: fmt(t.errors.tooMany, { max: MAX_BONDS_PER_OPERATION }) }

  try {
    await ensureProfile(user)
    const res = await prisma.prize_bonds.createMany({
      data: rows.map(r => ({
        user_id: user.id,
        number: r.number,
        series: r.series,
        holder: r.holder,
        purchase_date: dbDate(r.purchase_date),
        note: r.note
      })),
      skipDuplicates: true
    })
    revalidatePrizeBond()
    return { added: res.count, skipped: rows.length - res.count, invalid }
  } catch (error) {
    console.error('addBonds failed:', error)
    return { error: t.errors.saveFailed }
  }
}

const updateSchema = z.object({
  id: z.string().uuid(),
  number: z.union([z.string(), z.number()]),
  series: optSeries,
  holder: optText(100),
  purchase_date: optDate,
  encashed_on: optDate,
  note: optText(500)
})

export async function updateBond(input: z.input<typeof updateSchema>): Promise<{ success: true } | Fail> {
  const { user, t } = await ctx()
  if (!user) return { error: t.errors.unauthorized }
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) return { error: zodError(t, parsed.error) }
  const { id, series, holder, purchase_date, encashed_on, note } = parsed.data
  const number = normalizeBondNumber(parsed.data.number)
  if (!number) return { error: t.errors.invalidNumber }
  const today = todayInDhaka()
  if ((purchase_date && purchase_date > today) || (encashed_on && encashed_on > today)) return { error: t.errors.futureDate }
  if (purchase_date && encashed_on && encashed_on < purchase_date) return { error: t.errors.encashedBeforePurchase }

  try {
    const clash = await prisma.prize_bonds.findFirst({
      where: { user_id: user.id, number, series, NOT: { id } },
      select: { id: true }
    })
    if (clash) return { error: t.errors.duplicateBond }
    // Scoped by user_id: another user's bond id updates nothing → not found.
    const res = await prisma.prize_bonds.updateMany({
      where: { id, user_id: user.id },
      data: { number, series, holder, purchase_date: dbDate(purchase_date), encashed_on: dbDate(encashed_on), note }
    })
    if (res.count === 0) return { error: t.errors.notFound }
    revalidatePrizeBond()
    return { success: true }
  } catch (error) {
    if (isUniqueViolation(error)) return { error: t.errors.duplicateBond }
    console.error('updateBond failed:', error)
    return { error: t.errors.saveFailed }
  }
}

export async function deleteBonds(ids: string[]): Promise<{ deleted: number } | Fail> {
  const { user, t } = await ctx()
  if (!user) return { error: t.errors.unauthorized }
  const parsed = z.array(z.string().uuid()).min(1).max(MAX_BONDS_PER_OPERATION * 2).safeParse(ids)
  if (!parsed.success) return { error: t.errors.invalidInput }
  try {
    // Scoped to the user: ids of other users' bonds are silently ignored.
    const res = await prisma.prize_bonds.deleteMany({ where: { id: { in: parsed.data }, user_id: user.id } })
    if (res.count === 0) return { error: t.errors.notFound }
    revalidatePrizeBond()
    return { deleted: res.count }
  } catch (error) {
    console.error('deleteBonds failed:', error)
    return { error: t.errors.deleteFailed }
  }
}

// ---------------------------------------------------------------------------
// Draw check — the PDF is only read, never stored. Only WINS are recorded.
// ---------------------------------------------------------------------------

export type DrawCheckResult = {
  fileName: string
  drawNo: number | null
  drawDate: string | null
  valid: boolean
  warnings: ParsedDraw['warnings']
  prizes: ParsedDraw['prizes']
  /** How many of the user's bonds were compared. */
  checkedCount: number
  matches: CheckMatch[]
  /** Eligible wins newly added to the Winnings history (0 when already recorded). */
  recorded: number
  /** Why wins could not be recorded automatically (incomplete PDF / future date). */
  notRecordedReason: 'INCOMPLETE' | 'FUTURE_DATE' | null
}

export async function checkDrawPdf(formData: FormData): Promise<DrawCheckResult | Fail> {
  const { user, t } = await ctx()
  if (!user) return { error: t.errors.unauthorized }
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: t.errors.invalidPdf }
  if (file.size > MAX_PDF_BYTES) return { error: t.errors.fileTooLarge }

  const bytes = new Uint8Array(await file.arrayBuffer())
  if (String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') return { error: t.errors.invalidPdf }

  let parsed: ParsedDraw
  try {
    parsed = parseDrawText(await extractPdfText(bytes))
  } catch (error) {
    console.error('checkDrawPdf: extraction failed:', error)
    return { error: t.errors.unreadablePdf }
  }
  if (parsed.prizes.every(p => p.numbers.length === 0)) return { error: t.errors.unreadablePdf }

  try {
    const bonds = await loadBonds(user.id)
    // Without a draw date the 60-day rule cannot be judged (TOO_NEW → shown as a match),
    // but an encashed bond is still flagged; such results are never recorded (INCOMPLETE).
    const matches = buildCheckMatches(bonds, parsed.prizes, parsed.drawDate ?? '9999-12-31').map(m =>
      parsed.drawDate ? m : { ...m, eligibility: m.eligibility === 'TOO_NEW' ? ('ELIGIBLE' as const) : m.eligibility, deadline: '' }
    )

    let recorded = 0
    let notRecordedReason: DrawCheckResult['notRecordedReason'] = null
    const eligible = matches.filter(m => m.eligibility === 'ELIGIBLE')
    if (eligible.length > 0) {
      if (!parsed.valid || !parsed.drawNo || !parsed.drawDate) notRecordedReason = 'INCOMPLETE'
      else if (parsed.drawDate > todayInDhaka()) notRecordedReason = 'FUTURE_DATE'
      else {
        await ensureProfile(user)
        const res = await prisma.prize_bond_wins.createMany({
          data: eligible.map(m => ({
            user_id: user.id,
            bond_id: m.bond_id,
            number: m.number,
            series: m.series,
            holder: m.holder,
            draw_no: parsed.drawNo!,
            draw_date: dbDate(parsed.drawDate)!,
            rank: m.rank,
            amount: m.gross
          })),
          skipDuplicates: true // same PDF checked twice → no duplicates
        })
        recorded = res.count
        if (recorded > 0) revalidatePrizeBond()
      }
    }

    return {
      fileName: file.name.slice(0, 200),
      drawNo: parsed.drawNo,
      drawDate: parsed.drawDate,
      valid: parsed.valid,
      warnings: parsed.warnings,
      prizes: parsed.prizes,
      checkedCount: bonds.length,
      matches,
      recorded,
      notRecordedReason
    }
  } catch (error) {
    console.error('checkDrawPdf failed:', error)
    return { error: t.errors.loadFailed }
  }
}

// ---------------------------------------------------------------------------
// Wins history
// ---------------------------------------------------------------------------

export async function deleteWin(id: string): Promise<{ success: true } | Fail> {
  const { user, t } = await ctx()
  if (!user) return { error: t.errors.unauthorized }
  if (!z.string().uuid().safeParse(id).success) return { error: t.errors.invalidInput }
  try {
    const res = await prisma.prize_bond_wins.deleteMany({ where: { id, user_id: user.id } })
    if (res.count === 0) return { error: t.errors.notFound }
    revalidatePrizeBond()
    return { success: true }
  } catch (error) {
    console.error('deleteWin failed:', error)
    return { error: t.errors.deleteFailed }
  }
}
