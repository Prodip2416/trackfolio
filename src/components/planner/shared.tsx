'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, Loader2, X } from 'lucide-react'
import { searchPlannerCompanies } from '@/app/planner/actions'

export const fmtTk = (n: number | null | undefined) =>
  n === null || n === undefined || Number.isNaN(n)
    ? '—'
    : `৳${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const fmtNum = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 })

export const inputCls =
  'w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white placeholder-gray-400 dark:placeholder-gray-500'

export const labelCls = 'block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1'

export const cardCls =
  'bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm'

/** Parse a number input; empty string → null. */
export const numOrNull = (s: string): number | null => {
  if (s.trim() === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export type PickedCompany = { symbol: string; company_name: string; current_price: number | null }

export function StockPicker({
  value,
  onChange,
  disabled = false,
  allowClear = true
}: {
  value: PickedCompany | null
  onChange: (c: PickedCompany | null) => void
  disabled?: boolean
  allowClear?: boolean
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PickedCompany[]>([])
  const [searching, setSearching] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = query.trim()
    if (!q) return
    let cancelled = false
    const timer = setTimeout(async () => {
      setSearching(true)
      const rows = await searchPlannerCompanies(q)
      if (!cancelled) {
        setResults(rows)
        setSearching(false)
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setResults([])
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  if (value) {
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-indigo-900 dark:text-indigo-100">{value.symbol}</div>
          <div className="text-xs text-indigo-700 dark:text-indigo-300 truncate">
            {value.company_name}
            {value.current_price !== null && <> · Now {fmtTk(value.current_price)}</>}
          </div>
        </div>
        {allowClear && !disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-400 cursor-pointer"
            aria-label="Clear stock"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        value={query}
        onChange={e => {
          setQuery(e.target.value)
          if (!e.target.value.trim()) setResults([])
        }}
        placeholder="Search company (e.g. GP)"
        disabled={disabled}
        className={`${inputCls} pl-9`}
      />
      {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
      {results.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {results.map(c => (
            <button
              type="button"
              key={c.symbol}
              onClick={() => {
                onChange(c)
                setQuery('')
                setResults([])
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700/50 last:border-0 cursor-pointer"
            >
              <div className="flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white">
                <span>{c.symbol}</span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{fmtTk(c.current_price)}</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.company_name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  maxWidth = 'max-w-lg'
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full ${maxWidth} relative my-8`}>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="px-6 pb-6 pt-2">{children}</div>
      </div>
    </div>
  )
}
