import type en from '@/i18n/dictionaries/en.json'
import type { ParseWarning } from './parse-draw'

export type PrizeBondDict = (typeof en)['prizeBond']

/** "{count} bonds" + { count: 3 } → "3 bonds". Unknown placeholders are left as-is. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
}

export function warningText(t: PrizeBondDict, w: ParseWarning): string {
  const vars: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(w)) if (k !== 'code') vars[k] = v as string | number
  if ('rank' in w) vars.rank = t.rank[String(w.rank) as keyof PrizeBondDict['rank']]
  return fmt(t.warnings[w.code], vars)
}

/** ৳ with Indian grouping; 'bn-BD' gives Bangla digits (৳৬,০০,০০০). */
export const fmtTaka = (n: number, locale = 'en-IN') => `৳${n.toLocaleString(locale)}`

/** "2025-07-31" → "31 Jul 2025" / "৩১ জুল, ২০২৫" (UTC, no timezone shift). */
export function fmtDate(iso: string | null | undefined, locale = 'en-IN'): string {
  if (!iso) return '—'
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** Formatters bound to the dictionary's locale. */
export const makeFmt = (t: { locale: string }) => ({
  date: (iso: string | null | undefined) => fmtDate(iso, t.locale),
  taka: (n: number) => fmtTaka(n, t.locale),
  num: (n: number) => n.toLocaleString(t.locale)
})
