import prisma from '@/lib/prisma'
import { todayInDhaka } from '@/lib/date'
import { targetDistance, stopLossBreached, isReviewDue, OPEN_PLAN_STATUSES } from '@/lib/planner-calc'

// Server-only (imported by server components). Deliberately NOT a server action:
// it takes a userId, so it must never be callable from the client.

export type PlannerSnapshot = {
  targetHits: { id: string; symbol: string; type: 'BUY' | 'SELL'; price: number; current_price: number }[]
  stopLossHits: { id: string; symbol: string; type: 'BUY' | 'SELL'; stop_loss: number; current_price: number }[]
  reviewPlans: { id: string; symbol: string; type: 'BUY' | 'SELL'; review_date: string }[]
  reviewNotes: { id: string; title: string; review_date: string }[]
  activeCount: number
  ideaCount: number
  openBuyValue: number
  pinnedNotes: { id: string; title: string; symbol: string | null }[]
}

const toNum = (d: unknown): number | null => (d === null || d === undefined ? null : Number(d))
const toIsoDate = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null)

export async function getPlannerSnapshot(userId: string): Promise<PlannerSnapshot | null> {
  try {
    const today = todayInDhaka()
    const [plans, notes] = await Promise.all([
      prisma.trade_plans.findMany({
        where: { user_id: userId, status: { in: OPEN_PLAN_STATUSES } },
        include: { dse_company: { select: { current_price: true } } },
        orderBy: { created_at: 'desc' }
      }),
      prisma.planner_notes.findMany({
        where: { user_id: userId, OR: [{ pinned: true }, { review_date: { not: null } }] },
        select: { id: true, title: true, symbol: true, pinned: true, review_date: true },
        orderBy: { updated_at: 'desc' }
      })
    ])

    const snap: PlannerSnapshot = {
      targetHits: [],
      stopLossHits: [],
      reviewPlans: [],
      reviewNotes: [],
      activeCount: 0,
      ideaCount: 0,
      openBuyValue: 0,
      pinnedNotes: []
    }

    for (const p of plans) {
      const price = Number(p.price)
      const current = toNum(p.dse_company?.current_price)
      const stop = toNum(p.stop_loss)
      if (p.status === 'ACTIVE') snap.activeCount++
      else snap.ideaCount++
      if (p.type === 'BUY') snap.openBuyValue += price * Number(p.quantity)
      if (current !== null && targetDistance(p.type, price, current).hit) {
        snap.targetHits.push({ id: p.id, symbol: p.symbol, type: p.type, price, current_price: current })
      }
      if (current !== null && stop !== null && stopLossBreached(p.type, stop, current)) {
        snap.stopLossHits.push({ id: p.id, symbol: p.symbol, type: p.type, stop_loss: stop, current_price: current })
      }
      const rd = toIsoDate(p.review_date)
      if (rd && isReviewDue(rd, today)) snap.reviewPlans.push({ id: p.id, symbol: p.symbol, type: p.type, review_date: rd })
    }

    for (const n of notes) {
      const rd = toIsoDate(n.review_date)
      if (rd && isReviewDue(rd, today)) snap.reviewNotes.push({ id: n.id, title: n.title, review_date: rd })
      if (n.pinned && snap.pinnedNotes.length < 3) snap.pinnedNotes.push({ id: n.id, title: n.title, symbol: n.symbol })
    }

    snap.openBuyValue = Math.round(snap.openBuyValue * 100) / 100
    return snap
  } catch (error) {
    // Tables may not exist yet (SQL not applied) — the dashboard must still render.
    console.error('Error building planner snapshot:', error)
    return null
  }
}
