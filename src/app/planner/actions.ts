'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { isRealIsoDate } from '@/lib/date'
import { parseTags } from '@/lib/planner-calc'

// ---------------------------------------------------------------------------
// Types shared with client components
// ---------------------------------------------------------------------------

export type PlanStatus = 'IDEA' | 'ACTIVE' | 'EXECUTED' | 'CANCELLED'

export type TradePlan = {
  id: string
  symbol: string
  company_name: string
  type: 'BUY' | 'SELL'
  price: number
  quantity: number
  commission_pct: number
  stop_loss: number | null
  target_price: number | null
  reason: string | null
  status: PlanStatus
  review_date: string | null
  executed_at: string | null
  created_at: string
  current_price: number | null
}

export type PlannerNote = {
  id: string
  symbol: string | null
  company_name: string | null
  title: string
  body: string | null
  tags: string[]
  pinned: boolean
  review_date: string | null
  outcome: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function ensureProfile(user: { id: string; email?: string | null }) {
  await prisma.profiles.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, email: user.email ?? null }
  })
}

const toNum = (d: unknown): number | null => (d === null || d === undefined ? null : Number(d))
const toIsoDate = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null)
const toDbDate = (s: string | null | undefined): Date | null => (s ? new Date(`${s}T00:00:00.000Z`) : null)

function revalidatePlanner() {
  revalidatePath('/planner', 'layout')
  revalidatePath('/')
}

const optionalDate = z
  .string()
  .nullish()
  .transform(v => (v ? v : null))
  .refine(v => v === null || isRealIsoDate(v), { message: 'Invalid review date.' })

const optionalPositive = (label: string) =>
  z
    .number()
    .nullish()
    .transform(v => (v === undefined || v === null || Number.isNaN(v) || v === 0 ? null : v))
    .refine(v => v === null || v > 0, { message: `${label} must be greater than 0.` })

const optionalText = (max: number) =>
  z
    .string()
    .nullish()
    .transform(v => (v && v.trim() ? v.trim().slice(0, max) : null))

// ---------------------------------------------------------------------------
// Company search (DSE master list)
// ---------------------------------------------------------------------------

export async function searchPlannerCompanies(query: string) {
  const q = query.trim()
  if (!q) return []
  try {
    const rows = await prisma.dse_companies.findMany({
      where: {
        OR: [
          { symbol: { contains: q, mode: 'insensitive' } },
          { company_name: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: { symbol: true, company_name: true, sector: true, current_price: true },
      orderBy: { symbol: 'asc' },
      take: 20
    })
    return rows.map(r => ({ ...r, current_price: toNum(r.current_price) }))
  } catch (error) {
    console.error('Planner company search failed:', error)
    return []
  }
}

// ---------------------------------------------------------------------------
// Trade plans
// ---------------------------------------------------------------------------

export async function getTradePlans(): Promise<{ data?: TradePlan[]; lastCommissionPct?: number; error?: string }> {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const rows = await prisma.trade_plans.findMany({
      where: { user_id: user.id },
      include: { dse_company: { select: { company_name: true, current_price: true } } },
      orderBy: { created_at: 'desc' }
    })

    const data: TradePlan[] = rows.map(p => ({
      id: p.id,
      symbol: p.symbol,
      company_name: p.dse_company?.company_name || 'Unknown',
      type: p.type,
      price: Number(p.price),
      quantity: Number(p.quantity),
      commission_pct: Number(p.commission_pct),
      stop_loss: toNum(p.stop_loss),
      target_price: toNum(p.target_price),
      reason: p.reason,
      status: p.status,
      review_date: toIsoDate(p.review_date),
      executed_at: p.executed_at?.toISOString() ?? null,
      created_at: p.created_at.toISOString(),
      current_price: toNum(p.dse_company?.current_price)
    }))

    return { data, lastCommissionPct: await getLastCommissionPct(user.id) }
  } catch (error) {
    console.error('Error fetching trade plans:', error)
    return { error: 'Failed to load trade plans.' }
  }
}

/** The commission % the user entered on their most recently edited plan (0 if none). */
async function getLastCommissionPct(userId: string): Promise<number> {
  const last = await prisma.trade_plans.findFirst({
    where: { user_id: userId },
    orderBy: { updated_at: 'desc' },
    select: { commission_pct: true }
  })
  return last ? Number(last.commission_pct) : 0
}

export async function getLastCommission(): Promise<number> {
  const user = await getUser()
  if (!user) return 0
  try {
    return await getLastCommissionPct(user.id)
  } catch {
    return 0
  }
}

const planSchema = z
  .object({
    id: z.string().uuid().nullish(),
    symbol: z.string().trim().min(1, 'Please select a stock.').transform(s => s.toUpperCase()),
    type: z.enum(['BUY', 'SELL']),
    price: z.number({ message: 'Price is required.' }).positive('Price must be greater than 0.'),
    quantity: z
      .number({ message: 'Quantity is required.' })
      .int('Quantity must be a whole number.')
      .positive('Quantity must be greater than 0.'),
    commission_pct: z
      .number({ message: 'Commission % is required.' })
      .min(0, 'Commission % cannot be negative.')
      .max(10, 'Commission % looks too high (max 10).'),
    stop_loss: optionalPositive('Stop-loss'),
    target_price: optionalPositive('Target price'),
    reason: optionalText(2000),
    status: z.enum(['IDEA', 'ACTIVE', 'EXECUTED', 'CANCELLED']).default('IDEA'),
    review_date: optionalDate
  })
  .superRefine((v, ctx) => {
    if (v.type === 'BUY' && v.stop_loss !== null && v.stop_loss >= v.price) {
      ctx.addIssue({ code: 'custom', message: 'For a BUY plan, stop-loss should be below the buy price.' })
    }
    if (v.type === 'BUY' && v.target_price !== null && v.target_price <= v.price) {
      ctx.addIssue({ code: 'custom', message: 'For a BUY plan, target sell price should be above the buy price.' })
    }
  })

export type TradePlanInput = z.input<typeof planSchema>

export async function saveTradePlan(input: TradePlanInput) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = planSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Validation failed.' }
  const v = parsed.data

  try {
    const company = await prisma.dse_companies.findUnique({ where: { symbol: v.symbol }, select: { symbol: true } })
    if (!company) return { error: 'Invalid stock symbol.' }

    await ensureProfile(user)

    const data = {
      symbol: v.symbol,
      type: v.type,
      price: v.price,
      quantity: v.quantity,
      commission_pct: v.commission_pct,
      stop_loss: v.stop_loss,
      target_price: v.target_price,
      reason: v.reason,
      status: v.status,
      review_date: toDbDate(v.review_date)
    }

    if (v.id) {
      const existing = await prisma.trade_plans.findFirst({ where: { id: v.id, user_id: user.id }, select: { status: true, executed_at: true } })
      if (!existing) return { error: 'Plan not found.' }
      await prisma.trade_plans.update({
        where: { id: v.id },
        data: {
          ...data,
          executed_at: v.status === 'EXECUTED' ? existing.executed_at ?? new Date() : null
        }
      })
    } else {
      await prisma.trade_plans.create({
        data: { ...data, user_id: user.id, executed_at: v.status === 'EXECUTED' ? new Date() : null }
      })
    }

    revalidatePlanner()
    return { success: true }
  } catch (error) {
    console.error('Error saving trade plan:', error)
    return { error: 'Failed to save plan.' }
  }
}

export async function updateTradePlanStatus(id: string, status: PlanStatus) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  if (!['IDEA', 'ACTIVE', 'EXECUTED', 'CANCELLED'].includes(status)) return { error: 'Invalid status.' }

  try {
    const res = await prisma.trade_plans.updateMany({
      where: { id, user_id: user.id },
      data: { status, executed_at: status === 'EXECUTED' ? new Date() : null }
    })
    if (res.count === 0) return { error: 'Plan not found.' }
    revalidatePlanner()
    return { success: true }
  } catch (error) {
    console.error('Error updating plan status:', error)
    return { error: 'Failed to update status.' }
  }
}

export async function deleteTradePlan(id: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const res = await prisma.trade_plans.deleteMany({ where: { id, user_id: user.id } })
    if (res.count === 0) return { error: 'Plan not found.' }
    revalidatePlanner()
    return { success: true }
  } catch (error) {
    console.error('Error deleting plan:', error)
    return { error: 'Failed to delete plan.' }
  }
}

// ---------------------------------------------------------------------------
// Notes & journal
// ---------------------------------------------------------------------------

export async function getPlannerNotes(): Promise<{ data?: PlannerNote[]; error?: string }> {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const rows = await prisma.planner_notes.findMany({
      where: { user_id: user.id },
      include: { dse_company: { select: { company_name: true } } },
      orderBy: [{ pinned: 'desc' }, { updated_at: 'desc' }]
    })
    return {
      data: rows.map(n => ({
        id: n.id,
        symbol: n.symbol,
        company_name: n.dse_company?.company_name ?? null,
        title: n.title,
        body: n.body,
        tags: n.tags,
        pinned: n.pinned,
        review_date: toIsoDate(n.review_date),
        outcome: n.outcome,
        created_at: n.created_at.toISOString(),
        updated_at: n.updated_at.toISOString()
      }))
    }
  } catch (error) {
    console.error('Error fetching notes:', error)
    return { error: 'Failed to load notes.' }
  }
}

const noteSchema = z.object({
  id: z.string().uuid().nullish(),
  symbol: z
    .string()
    .nullish()
    .transform(v => (v && v.trim() ? v.trim().toUpperCase() : null)),
  title: z.string().trim().min(1, 'Title is required.').max(200, 'Title is too long (max 200).'),
  body: optionalText(10000),
  tags: z.string().nullish().transform(v => parseTags(v || '')),
  pinned: z.boolean().default(false),
  review_date: optionalDate,
  outcome: optionalText(5000)
})

export type PlannerNoteInput = z.input<typeof noteSchema>

export async function savePlannerNote(input: PlannerNoteInput) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = noteSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Validation failed.' }
  const v = parsed.data

  try {
    if (v.symbol) {
      const company = await prisma.dse_companies.findUnique({ where: { symbol: v.symbol }, select: { symbol: true } })
      if (!company) return { error: 'Invalid stock symbol.' }
    }

    await ensureProfile(user)

    const data = {
      symbol: v.symbol,
      title: v.title,
      body: v.body,
      tags: v.tags,
      pinned: v.pinned,
      review_date: toDbDate(v.review_date),
      outcome: v.outcome
    }

    if (v.id) {
      const res = await prisma.planner_notes.updateMany({ where: { id: v.id, user_id: user.id }, data })
      if (res.count === 0) return { error: 'Note not found.' }
    } else {
      await prisma.planner_notes.create({ data: { ...data, user_id: user.id } })
    }

    revalidatePlanner()
    return { success: true }
  } catch (error) {
    console.error('Error saving note:', error)
    return { error: 'Failed to save note.' }
  }
}

export async function toggleNotePin(id: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const note = await prisma.planner_notes.findFirst({ where: { id, user_id: user.id }, select: { pinned: true } })
    if (!note) return { error: 'Note not found.' }
    await prisma.planner_notes.update({ where: { id }, data: { pinned: !note.pinned } })
    revalidatePlanner()
    return { success: true }
  } catch (error) {
    console.error('Error toggling pin:', error)
    return { error: 'Failed to update note.' }
  }
}

export async function deletePlannerNote(id: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const res = await prisma.planner_notes.deleteMany({ where: { id, user_id: user.id } })
    if (res.count === 0) return { error: 'Note not found.' }
    revalidatePlanner()
    return { success: true }
  } catch (error) {
    console.error('Error deleting note:', error)
    return { error: 'Failed to delete note.' }
  }
}

// ---------------------------------------------------------------------------
// Calculator: long-term portfolio holdings only (Short Term is never included)
// ---------------------------------------------------------------------------

export type CalculatorHolding = {
  symbol: string
  company_name: string
  quantity: number
  average_price: number
  current_price: number | null
}

export async function getCalculatorHoldings(): Promise<CalculatorHolding[]> {
  const user = await getUser()
  if (!user) return []

  try {
    const rows = await prisma.stocks.findMany({
      where: { user_id: user.id, total_quantity: { gt: 0 } },
      select: {
        symbol: true,
        total_quantity: true,
        average_buy_price: true,
        dse_company: { select: { company_name: true, current_price: true } }
      },
      orderBy: { symbol: 'asc' }
    })
    return rows.map(r => ({
      symbol: r.symbol,
      company_name: r.dse_company?.company_name || 'Unknown',
      quantity: Number(r.total_quantity || 0),
      average_price: Number(r.average_buy_price || 0),
      current_price: toNum(r.dse_company?.current_price)
    }))
  } catch (error) {
    console.error('Error fetching calculator holdings:', error)
    return []
  }
}

