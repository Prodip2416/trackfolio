'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, ChevronLeft, ChevronRight, FileSpreadsheet, Layers, Pencil, Plus, Search, Ticket, Trash2, Wallet, X } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/shared/ConfirmModal'
import type { BondRow } from '@/lib/prize-bond/service'
import type { BondSummary } from '@/lib/prize-bond/winnings'
import { deleteBonds } from '@/app/prize-bond/actions'
import BondFormModal from './BondFormModal'
import ImportModal from './ImportModal'
import {
  MAC_FONT,
  MAC_MONO,
  MacHeader,
  MacStat,
  TrafficLights,
  callAction,
  fmt,
  glass,
  macBtn,
  macPrimary,
  macSecondary,
  makeFmt,
  type PrizeBondDict
} from './shared'

type Filter = 'ALL' | 'ACTIVE' | 'ENCASHED'
const PAGE_SIZE = 10

/** Page numbers with ellipsis: 1 … 4 5 6 … 20 */
function pageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) out.push('…')
  for (let p = start; p <= end; p++) out.push(p)
  if (end < total - 1) out.push('…')
  out.push(total)
  return out
}

export default function BondsClient({
  bonds,
  summary,
  t,
  confirmDict
}: {
  bonds: BondRow[]
  summary: BondSummary
  t: PrizeBondDict
  confirmDict: unknown
}) {
  const router = useRouter()
  const f = makeFmt(t)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('ALL')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<BondRow | null>(null)
  const [importing, setImporting] = useState(false)
  const [deleting, setDeleting] = useState<{ ids: string[]; title: string; message: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bonds.filter(b => {
      if (filter === 'ACTIVE' && b.encashed_on) return false
      if (filter === 'ENCASHED' && !b.encashed_on) return false
      if (!q) return true
      return `${b.number} ${b.series ?? ''} ${b.holder ?? ''} ${b.note ?? ''}`.toLowerCase().includes(q)
    })
  }, [bonds, filter, search])

  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const current = Math.min(page, pages) // list can shrink after a delete / refresh
  const from = (current - 1) * PAGE_SIZE
  const shown = visible.slice(from, from + PAGE_SIZE)

  const allShownSelected = shown.length > 0 && shown.every(b => selected.has(b.id))
  function toggleAll() {
    const next = new Set(selected)
    if (allShownSelected) shown.forEach(b => next.delete(b.id))
    else shown.forEach(b => next.add(b.id))
    setSelected(next)
  }
  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    const r = await callAction(() => deleteBonds(deleting.ids), { fallback: t.errors.deleteFailed })
    setBusy(false)
    if (r) {
      toast.success(fmt(t.toast.deleted, { count: r.deleted }))
      setSelected(new Set())
      setDeleting(null)
      router.refresh()
    }
  }

  const filters: [Filter, string][] = [
    ['ALL', `${t.common.all} ${bonds.length}`],
    ['ACTIVE', t.bonds.active],
    ['ENCASHED', t.bonds.encashed]
  ]

  const stats = [
    { testId: 'pb-stat-total', icon: Ticket, tone: 'indigo' as const, label: t.bonds.totalBonds, value: f.num(summary.bondCount), sub: `${t.bonds.activeBonds}: ${f.num(summary.activeCount)}` },
    { icon: Wallet, tone: 'teal' as const, label: t.bonds.invested, value: f.taka(summary.invested), sub: t.bonds.investedSub },
    { icon: Layers, tone: 'green' as const, label: t.bonds.ranges, value: f.num(summary.ranges), sub: t.bonds.rangesSub },
    { icon: Archive, tone: 'orange' as const, label: t.bonds.encashedBonds, value: f.num(summary.bondCount - summary.activeCount) }
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-0 antialiased" style={MAC_FONT}>
      <MacHeader
        title={t.bonds.title}
        subtitle={t.bonds.subtitle}
        actions={
          <>
            <button type="button" className={macSecondary} onClick={() => setImporting(true)} data-testid="pb-import-open">
              <FileSpreadsheet className="w-4 h-4 text-[#34c759]" /> {t.bonds.import}
            </button>
            <button type="button" className={macPrimary} onClick={() => setAdding(true)} data-testid="pb-add-open">
              <Plus className="w-4 h-4" /> {t.bonds.add}
            </button>
          </>
        }
      />

      {/* Stat widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(s => (
          <MacStat key={s.label} {...s} />
        ))}
      </div>

      {/* Window */}
      <div className={`${glass} rounded-2xl overflow-hidden`}>
        {/* Title bar + toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.08] bg-gradient-to-b from-white/60 to-gray-50/40 dark:from-white/[0.04] dark:to-transparent">
          <div className="flex items-center gap-3">
            <TrafficLights />
            {/* Segmented control */}
            <div className="flex p-0.5 rounded-lg bg-black/[0.05] dark:bg-white/[0.08] overflow-x-auto max-w-full">
              {filters.map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setFilter(v)
                    setPage(1)
                  }}
                  className={`px-3 h-7 text-[12px] font-medium rounded-md whitespace-nowrap cursor-pointer transition-all ${
                    filter === v
                      ? 'bg-white dark:bg-white/20 text-gray-900 dark:text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)]'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 items-center lg:ml-auto">
            {selected.size > 0 && (
              <button
                type="button"
                data-testid="pb-bulk-delete"
                className={`${macBtn} text-[#ff3b30] bg-[#ff3b30]/10 hover:bg-[#ff3b30]/15 whitespace-nowrap`}
                onClick={() =>
                  setDeleting({
                    ids: [...selected],
                    title: t.confirm.deleteBondsTitle,
                    message: fmt(t.confirm.deleteBondsMessage, { count: selected.size })
                  })
                }
              >
                <Trash2 className="w-3.5 h-3.5" /> {fmt(t.bonds.deleteSelected, { count: selected.size })}
              </button>
            )}
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder={t.bonds.search}
                className="w-full h-8 pl-8 pr-7 rounded-lg text-[13px] bg-black/[0.05] dark:bg-white/[0.08] border border-transparent focus:bg-white dark:focus:bg-white/10 focus:border-[#007aff]/50 focus:ring-[3px] focus:ring-[#007aff]/25 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                data-testid="pb-search"
              />
              {search && (
                <button
                  type="button"
                  aria-label={t.common.close}
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-400/60 text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" strokeWidth={3} />
                </button>
              )}
            </div>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="py-16 text-center">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]">
              <Ticket className="w-7 h-7 text-gray-400" />
            </span>
            <p className="mt-3 text-[13px] text-gray-500 dark:text-gray-400">{bonds.length === 0 ? t.bonds.empty : t.bonds.noMatch}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-[13px]" data-testid="pb-bonds-table">
                <thead>
                  <tr className="text-[11px] font-medium text-gray-500 dark:text-gray-400 border-b border-black/[0.06] dark:border-white/[0.08]">
                    <th className="pl-4 pr-2 py-2 w-8 text-left">
                      <input type="checkbox" aria-label={t.bonds.selectAll} checked={allShownSelected} onChange={toggleAll} className="accent-[#007aff] cursor-pointer align-middle" />
                    </th>
                    <th className="px-3 py-2 text-left font-medium">{t.common.number}</th>
                    <th className="px-3 py-2 text-left font-medium">{t.common.series}</th>
                    <th className="px-3 py-2 text-left font-medium">{t.common.holder}</th>
                    <th className="px-3 py-2 text-left font-medium whitespace-nowrap">{t.common.purchaseDate}</th>
                    <th className="px-3 py-2 text-left font-medium">{t.common.status}</th>
                    <th className="px-3 py-2 text-left font-medium">{t.common.note}</th>
                    <th className="pl-3 pr-4 py-2 text-right font-medium">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(b => {
                    const isSel = selected.has(b.id)
                    return (
                      <tr
                        key={b.id}
                        data-testid={`pb-bond-${b.number}`}
                        className={`group transition-colors ${
                          isSel ? 'bg-[#007aff]/[0.14] dark:bg-[#0a84ff]/25' : 'even:bg-black/[0.018] dark:even:bg-white/[0.025] hover:bg-black/[0.035] dark:hover:bg-white/[0.05]'
                        }`}
                      >
                        <td className="pl-4 pr-2 py-2.5">
                          <input type="checkbox" aria-label={b.number} checked={isSel} onChange={() => toggle(b.id)} className="accent-[#007aff] cursor-pointer align-middle" />
                        </td>
                        <td className="px-3 py-2.5 font-semibold tabular-nums text-gray-900 dark:text-white" style={MAC_MONO}>
                          {b.number}
                        </td>
                        <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{b.series ?? <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                        <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{b.holder ?? <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                        <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 whitespace-nowrap tabular-nums">
                          {b.purchase_date ? f.date(b.purchase_date) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {b.encashed_on ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-500/10 text-gray-600 dark:text-gray-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                {t.bonds.encashed} · {f.date(b.encashed_on)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#34c759]/12 text-[#248a3d] dark:text-[#30d158]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#34c759]" />
                                {t.bonds.active}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 max-w-[14rem] truncate" title={b.note ?? ''}>
                          {b.note ?? ''}
                        </td>
                        <td className="pl-3 pr-4 py-2.5">
                          <div className="flex justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              title={t.common.edit}
                              aria-label={`${t.common.edit} ${b.number}`}
                              onClick={() => setEditing(b)}
                              className="p-1.5 rounded-md text-gray-500 hover:text-[#007aff] hover:bg-[#007aff]/10 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title={t.common.delete}
                              aria-label={`${t.common.delete} ${b.number}`}
                              onClick={() =>
                                setDeleting({
                                  ids: [b.id],
                                  title: t.confirm.deleteBondTitle,
                                  message: fmt(t.confirm.deleteBondMessage, { number: b.series ? `${b.series}-${b.number}` : b.number })
                                })
                              }
                              className="p-1.5 rounded-md text-gray-500 hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02]">
              <span className="text-[12px] text-gray-500 dark:text-gray-400 tabular-nums" data-testid="pb-showing">
                {fmt(t.bonds.range, { from: from + 1, to: from + shown.length, total: visible.length })}
              </span>
              <nav className="flex items-center gap-1" aria-label="Pagination" data-testid="pb-pagination">
                <button
                  type="button"
                  aria-label={t.bonds.prev}
                  disabled={current === 1}
                  onClick={() => setPage(current - 1)}
                  className="w-7 h-7 inline-flex items-center justify-center rounded-md text-gray-600 dark:text-gray-300 hover:bg-black/[0.06] dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {pageList(current, pages).map((p, i) =>
                  p === '…' ? (
                    <span key={`e${i}`} className="w-7 text-center text-[12px] text-gray-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      aria-current={p === current ? 'page' : undefined}
                      onClick={() => setPage(p)}
                      className={`min-w-7 h-7 px-2 rounded-md text-[12px] font-medium tabular-nums cursor-pointer transition-all ${
                        p === current
                          ? 'text-white bg-gradient-to-b from-[#3b9bff] to-[#007aff] shadow-[0_1px_2px_rgba(0,122,255,0.35)]'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-black/[0.06] dark:hover:bg-white/10'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  type="button"
                  aria-label={t.bonds.next}
                  disabled={current === pages}
                  onClick={() => setPage(current + 1)}
                  className="w-7 h-7 inline-flex items-center justify-center rounded-md text-gray-600 dark:text-gray-300 hover:bg-black/[0.06] dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
              <span className="text-[12px] text-gray-500 dark:text-gray-400 tabular-nums">{fmt(t.bonds.page, { page: current, pages })}</span>
            </div>
          </>
        )}
      </div>

      {(adding || editing) && (
        <BondFormModal
          t={t}
          bond={editing}
          onClose={() => {
            setAdding(false)
            setEditing(null)
          }}
          onSaved={() => {
            setAdding(false)
            setEditing(null)
            router.refresh()
          }}
        />
      )}
      {importing && (
        <ImportModal
          t={t}
          onClose={() => setImporting(false)}
          onSaved={() => {
            setImporting(false)
            router.refresh()
          }}
        />
      )}
      <ConfirmModal
        isOpen={!!deleting}
        title={deleting?.title ?? ''}
        message={deleting?.message ?? ''}
        isLoading={busy}
        onConfirm={confirmDelete}
        onClose={() => !busy && setDeleting(null)}
        dict={confirmDict}
      />
    </div>
  )
}
