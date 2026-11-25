import type en from '@/i18n/dictionaries/en.json'

export type ReturnsDict = (typeof en)['returns']

export { fmt } from '@/lib/prize-bond/i18n'

/** Number/date formatters bound to the dictionary's locale ('bn-BD' gives Bangla digits). */
export function makeFormat(locale: string) {
  const num = (n: number, digits = 0) =>
    n.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })
  return {
    num: (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 4 }),
    taka: (n: number) => `${n < 0 ? '−' : ''}৳${num(Math.abs(n))}`,
    signedTaka: (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}৳${num(Math.abs(n))}`,
    price: (n: number) => `৳${num(n, 2)}`,
    pct: (fraction: number) => `${fraction > 0 ? '+' : fraction < 0 ? '−' : ''}${num(Math.abs(fraction * 100), 2)}%`,
    date: (iso: string) =>
      new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }),
    year: (y: number) => y.toLocaleString(locale, { useGrouping: false })
  }
}

export const toneOf = (n: number | null | undefined) =>
  n === null || n === undefined || Math.abs(n) < 1e-9
    ? 'text-gray-900 dark:text-white'
    : n > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-red-600 dark:text-red-400'

export const card = 'bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800'
