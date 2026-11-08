'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Pencil, Trash2, PlayCircle, Target, ShieldAlert, CalendarClock, Search, Calculator } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/shared/ConfirmModal'
import SmartTransactionForm from '@/components/transactions/SmartTransactionForm'
import { runAction } from '@/lib/run-action'
import { todayLocal } from '@/lib/date'
import { planCost, targetDistance, stopLossBreached, isReviewDue } from '@/lib/planner-calc'
import { deleteTradePlan, updateTradePlanStatus, type TradePlan, type PlanStatus } from '@/app/planner/actions'
import PlanFormModal from './PlanFormModal'
import { cardCls, fmtNum, fmtTk, inputCls } from './shared'

type Tab = 'OPEN' | 'EXECUTED' | 'CANCELLED' | 'ALL'

const STATUS_BADGE: Record<PlanStatus, string> = {
  IDEA: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  ACTIVE: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  EXECUTED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400'
}
const STATUS_LABEL: Record<PlanStatus, string> = { IDEA: '💡 Idea', ACTIVE: '🎯 Active', EXECUTED: '✅ Executed', CANCELLED: '❌ Cancelled' }

export default function TradePlanClient({
  plans,
  lastCommissionPct,
  focusId
}: {
  plans: TradePlan[]
  lastCommissionPct: number
  focusId?: string
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>(() => {
    const focused = focusId ? plans.find(p => p.id === focusId) : undefined
    if (focused && (focused.status === 'EXECUTED' || focused.status === 'CANCELLED')) return focused.status
    return 'OPEN'
  })
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TradePlan | null>(null)
  const [executing, setExecuting] = useState<TradePlan | null>(null)
  const [deleting, setDeleting] = useState<TradePlan | null>(null)
  const [busy, setBusy] = useState(false)
  const today = todayLocal()

  useEffect(() => {
    if (!focusId) return
    const el = document.getElementById(`plan-${focusId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusId])

  const enriched = useMemo(
    () =>
      plans.map(p => {
        const dist = targetDistance(p.type, p.price, p.current_price)
        const open = p.status === 'IDEA' || p.status === 'ACTIVE'
        return {
          ...p,
          cost: planCost(p.type, p.price, p.quantity, p.commission_pct),
          dist,
          open,
          hit: open && dist.hit,
          slHit: open && stopLossBreached(p.type, p.stop_loss, p.current_price),
          reviewDue: open && isReviewDue(p.review_date, today)
        }
      }),
    [plans, today]
  )

  const counts = useMemo(
    () => ({
      OPEN: enriched.filter(p => p.open).length,
      EXECUTED: enriched.filter(p => p.status === 'EXECUTED').length,
      CANCELLED: enriched.filter(p => p.status === 'CANCELLED').length,
      ALL: enriched.length,
      hits: enriched.filter(p => p.hit).length,
      reviews: enriched.filter(p => p.reviewDue).length,
      openBuy: enriched.filter(p => p.open && p.type === 'BUY').reduce((s, p) => s + p.cost.net, 0)
    }),
    [enriched]
  )

  const visible = enriched.filter(p => {
    if (tab === 'OPEN' && !p.open) return false
    if ((tab === 'EXECUTED' || tab === 'CANCELLED') && p.status !== tab) return false
    if (typeFilter !== 'ALL' && p.type !== typeFilter) return false
    const q = search.trim().toLowerCase()
    if (q && !p.symbol.toLowerCase().includes(q) && !p.company_name.toLowerCase().includes(q)) return false
    return true
  })

  async function changeStatus(p: TradePlan, status: PlanStatus) {
    if (status === p.status) return
    const ok = await runAction(() => updateTradePlanStatus(p.id, status), 'Status updated')
    if (ok) router.refresh()
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    const ok = await runAction(() => deleteTradePlan(deleting.id), 'Plan deleted')
    setBusy(false)
    if (ok) {
      setDeleting(null)
      router.refresh()
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Trade Plan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Plan buys and sells before you make them. Nothing here touches your real portfolio.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/planner/calculator"
            className="inline-flex items-center px-3 py-2 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            <Calculator className="w-4 h-4 mr-1.5" /> Calculator
          </Link>
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" /> New Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Open plans', value: String(counts.OPEN), cls: 'text-gray-900 dark:text-white' },
          { label: 'Open buy value', value: fmtTk(counts.openBuy), cls: 'text-indigo-600 dark:text-indigo-400' },
          { label: '🔔 Target hit', value: String(counts.hits), cls: 'text-emerald-600 dark:text-emerald-400' },
          { label: '📅 Review due', value: String(counts.reviews), cls: 'text-amber-600 dark:text-amber-400' }
        ].map(k => (
          <div key={k.label} className={`${cardCls} p-4`}>
            <div className="text-xs text-gray-500 dark:text-gray-400">{k.label}</div>
            <div className={`text-xl font-bold mt-1 ${k.cls}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-fit overflow-x-auto max-w-full">
          {(['OPEN', 'EXECUTED', 'CANCELLED', 'ALL'] as Tab[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap cursor-pointer ${
                tab === t ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {t === 'OPEN' ? 'Open' : t === 'EXECUTED' ? 'Executed' : t === 'CANCELLED' ? 'Cancelled' : 'All'} ({counts[t]})
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as 'ALL' | 'BUY' | 'SELL')} className={`${inputCls} w-28`}>
            <option value="ALL">All types</option>
            <option value="BUY">Buy</option>
            <option value="SELL">Sell</option>
          </select>
          <div className="relative flex-1 lg:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stock" className={`${inputCls} pl-9`} />
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className={`${cardCls} p-10 text-center`}>
          <Target className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {plans.length === 0 ? 'No plans yet. Click “New Plan” to write your first one.' : 'No plans match these filters.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map(p => (
            <div
              key={p.id}
              id={`plan-${p.id}`}
              className={`${cardCls} p-4 ${p.id === focusId ? 'ring-2 ring-indigo-500' : ''}`}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-3 justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        p.type === 'BUY' ? 'bg-indigo-600 text-white' : 'bg-red-600 text-white'
                      }`}
                    >
                      {p.type}
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">{p.symbol}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px]">{p.company_name}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${STATUS_BADGE[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                    {p.hit && <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-600 text-white">🔔 Target Hit</span>}
                    {p.slHit && (
                      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        <ShieldAlert className="w-3 h-3 mr-1" /> Stop-loss
                      </span>
                    )}
                    {p.reviewDue && (
                      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        <CalendarClock className="w-3 h-3 mr-1" /> Review
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                    <Info label="Plan" value={`${fmtNum(p.quantity)} × ${fmtTk(p.price)}`} />
                    <Info label={`Commission (${p.commission_pct}%)`} value={fmtTk(p.cost.commission)} />
                    <Info label={p.type === 'BUY' ? 'Total to pay' : 'You receive'} value={fmtTk(p.cost.net)} strong />
                    <Info
                      label="Now"
                      value={
                        p.current_price === null
                          ? '—'
                          : `${fmtTk(p.current_price)}${p.dist.diffPct !== null ? ` (${p.dist.diffPct > 0 ? '+' : ''}${p.dist.diffPct}%)` : ''}`
                      }
                    />
                    {p.stop_loss !== null && <Info label="Stop-loss" value={fmtTk(p.stop_loss)} />}
                    {p.target_price !== null && <Info label="Target" value={fmtTk(p.target_price)} />}
                    {p.review_date && <Info label="Review" value={p.review_date} />}
                    {p.executed_at && <Info label="Executed" value={p.executed_at.slice(0, 10)} />}
                  </div>

                  {p.reason && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">{p.reason}</p>}
                </div>

                <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0">
                  <select
                    value={p.status}
                    onChange={e => changeStatus(p, e.target.value as PlanStatus)}
                    className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white cursor-pointer"
                    aria-label="Change status"
                  >
                    {(Object.keys(STATUS_LABEL) as PlanStatus[]).map(s => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-1">
                    {p.open && (
                      <button
                        type="button"
                        onClick={() => setExecuting(p)}
                        title="Execute — log as a real trade"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Execute
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(p)
                        setFormOpen(true)
                      }}
                      title="Edit"
                      className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(p)}
                      title="Delete"
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <PlanFormModal
          plan={editing ?? undefined}
          defaultCommissionPct={lastCommissionPct}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
        />
      )}

      {executing && (
        <SmartTransactionForm
          prefill={{
            symbol: executing.symbol,
            company_name: executing.company_name,
            type: executing.type,
            quantity: executing.quantity,
            price_per_unit: executing.price,
            brokerage_fee: planCost(executing.type, executing.price, executing.quantity, executing.commission_pct).commission
          }}
          onSaved={async () => {
            const res = await updateTradePlanStatus(executing.id, 'EXECUTED')
            if (res?.error) toast.error('Trade saved, but the plan status could not be updated.')
          }}
          onClose={() => setExecuting(null)}
        />
      )}

      <ConfirmModal
        isOpen={!!deleting}
        title="Delete plan?"
        message={deleting ? `Delete the ${deleting.type} plan for ${deleting.symbol}? This cannot be undone.` : ''}
        isLoading={busy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}

function Info({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className={`truncate ${strong ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-800 dark:text-gray-200'}`}>{value}</div>
    </div>
  )
}
