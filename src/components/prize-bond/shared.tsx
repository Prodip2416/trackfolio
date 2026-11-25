'use client'

import type { ReactNode } from 'react'
import toast from 'react-hot-toast'
export { Modal, cardCls, inputCls, labelCls } from '@/components/planner/shared'
export { fmt, makeFmt, type PrizeBondDict } from '@/lib/prize-bond/i18n'

// macOS-style tokens shared by the Prize Bond pages (system font, frosted glass,
// hairline borders, system blue).
export const MAC_FONT = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Inter, system-ui, sans-serif" }
/** Even-width digits for bond numbers (SF Mono on macOS, Menlo/Consolas/DejaVu elsewhere). */
export const MAC_MONO = { fontFamily: "'SF Mono', ui-monospace, Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace" }
export const glass =
  'bg-white/75 dark:bg-[#1e1e20]/75 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_30px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]'
export const macBtn =
  'inline-flex items-center justify-center gap-1.5 h-8 px-3.5 rounded-lg text-[13px] font-medium transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
export const macPrimary = `${macBtn} text-white bg-gradient-to-b from-[#3b9bff] to-[#007aff] shadow-[0_1px_1px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.25)] hover:brightness-105`
export const macSecondary = `${macBtn} text-gray-800 dark:text-gray-100 bg-white dark:bg-white/10 border border-black/10 dark:border-white/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-gray-50 dark:hover:bg-white/15`

/** macOS window chrome: traffic lights + optional title, for a glass panel header. */
export function TrafficLights() {
  return (
    <div className="hidden sm:flex gap-1.5" aria-hidden>
      <span className="w-3 h-3 rounded-full bg-[#ff5f57] border border-black/10" />
      <span className="w-3 h-3 rounded-full bg-[#febc2e] border border-black/10" />
      <span className="w-3 h-3 rounded-full bg-[#28c840] border border-black/10" />
    </div>
  )
}

/** iOS/macOS widget colours: full gradient card with white text. */
export const STAT_TONES = {
  indigo: 'from-[#5e5ce6] via-[#6f6cf0] to-[#a29bfe] shadow-[0_12px_28px_-12px_rgba(94,92,230,0.65)]',
  teal: 'from-[#0a84ff] via-[#30b0c7] to-[#5ad8e6] shadow-[0_12px_28px_-12px_rgba(48,176,199,0.65)]',
  green: 'from-[#28a745] via-[#34c759] to-[#7ee08f] shadow-[0_12px_28px_-12px_rgba(52,199,89,0.6)]',
  orange: 'from-[#ff6b00] via-[#ff9f0a] to-[#ffd60a] shadow-[0_12px_28px_-12px_rgba(255,159,10,0.65)]',
  pink: 'from-[#d63384] via-[#ff375f] to-[#ff8fab] shadow-[0_12px_28px_-12px_rgba(255,55,95,0.6)]',
  slate: 'from-[#48484a] via-[#636366] to-[#8e8e93] shadow-[0_12px_28px_-12px_rgba(72,72,74,0.6)]'
} as const
export type StatTone = keyof typeof STAT_TONES

export function MacStat({
  icon: Icon,
  tone,
  label,
  value,
  sub,
  testId
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  tone: StatTone
  label: string
  value: ReactNode
  sub?: ReactNode
  testId?: string
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 text-white bg-gradient-to-br ${STAT_TONES[tone]} ring-1 ring-inset ring-white/15 transition-transform hover:-translate-y-0.5`}
      data-testid={testId}
    >
      {/* soft light + big faded icon, like a macOS widget */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/20 blur-2xl" aria-hidden />
      <Icon className="pointer-events-none absolute -bottom-3 -right-2 w-20 h-20 text-white/15" strokeWidth={1.5} />
      <div className="relative flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-[8px] bg-white/25 backdrop-blur-sm ring-1 ring-inset ring-white/30">
          <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
        </span>
        <p className="text-[12px] font-semibold text-white/90">{label}</p>
      </div>
      <p className="relative mt-2 text-[28px] font-semibold tracking-[-0.02em] tabular-nums drop-shadow-sm">{value}</p>
      {sub && <p className="relative text-[11px] font-medium text-white/80">{sub}</p>}
    </div>
  )
}

export function MacHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
      <div>
        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-gray-900 dark:text-white">{title}</h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">{subtitle}</p>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

/**
 * Runs a prize-bond server action (which reports failure as `{ error }`), toasts the
 * outcome and returns the typed success value, or null on failure.
 */
export async function callAction<T extends object>(
  action: () => Promise<T | { error: string }>,
  { success, fallback }: { success?: string; fallback: string }
): Promise<T | null> {
  try {
    const r = await action()
    if ('error' in r && typeof r.error === 'string') {
      toast.error(r.error)
      return null
    }
    if (success) toast.success(success)
    return r as T
  } catch (err) {
    console.error(err)
    toast.error(fallback)
    return null
  }
}

export const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-sm cursor-pointer'
export const btnSecondary =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg ring-1 ring-inset ring-gray-300 dark:ring-slate-700 cursor-pointer disabled:opacity-50'
export const btnDanger =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm cursor-pointer'

export const RANK_STYLES: Record<number, string> = {
  1: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  2: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  3: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  4: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  5: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
}

export function Badge({ className = '', children }: { className?: string; children: ReactNode }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${className}`}>{children}</span>
}

export function StatCard({ label, value, sub, testId }: { label: string; value: ReactNode; sub?: ReactNode; testId?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4" data-testid={testId}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
