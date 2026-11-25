'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Info, Lock, Save } from 'lucide-react'
import { runAction } from '@/lib/run-action'
import { saveYearEndPrice } from '@/app/analytics/returns/actions'
import { card, fmt, makeFormat, type ReturnsDict } from './format'

export type PriceRow = {
  symbol: string
  qty: number
  price: number | null
  priceDate: string | null
  source: 'sync' | 'manual' | null
  status: 'missing' | 'stale' | 'ok'
  editable: boolean
}

const BASE = '/analytics/returns/prices'

const STATUS_STYLE: Record<PriceRow['status'], string> = {
  missing: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  stale: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  ok: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
}

export default function YearEndPricesClient({ t, years, year, rows }: { t: ReturnsDict; years: number[]; year: number | null; rows: PriceRow[] }) {
  const f = makeFormat(t.locale)
  const [missingOnly, setMissingOnly] = useState(false)
  const shown = missingOnly ? rows.filter(r => r.status !== 'ok') : rows
  const tp = t.prices

  return (
    <div className="max-w-5xl mx-auto space-y-6" data-testid="prices-page">
      <div>
        <Link href="/analytics/returns" className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          <ArrowLeft className="w-4 h-4" /> {tp.back}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{tp.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{tp.subtitle}</p>
      </div>

      {year === null ? (
        <div className={`${card} p-10 text-center text-gray-500 dark:text-gray-400`} data-testid="prices-no-years">{tp.noYears}</div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav className="flex flex-wrap gap-2" aria-label={tp.year}>
              {years.map(y => (
                <Link
                  key={y}
                  href={`${BASE}?year=${y}`}
                  data-testid={`prices-year-${y}`}
                  aria-current={y === year ? 'page' : undefined}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium ${
                    y === year
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {f.year(y)}
                </Link>
              ))}
            </nav>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={missingOnly} onChange={e => setMissingOnly(e.target.checked)} data-testid="prices-missing-only" className="rounded" />
              {tp.missingOnly}
            </label>
          </div>

          <div className="flex items-start gap-2 rounded-xl border px-4 py-3 text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{fmt(tp.note, { year: f.year(year) })}</p>
          </div>

          <div className={`${card} overflow-hidden`}>
            {rows.length === 0 ? (
              <p className="p-10 text-center text-gray-500 dark:text-gray-400" data-testid="prices-none">{fmt(tp.none, { year: f.year(year) })}</p>
            ) : shown.length === 0 ? (
              <p className="p-10 text-center text-gray-500 dark:text-gray-400" data-testid="prices-all-set">{fmt(tp.allSet, { year: f.year(year) })}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm" data-testid="prices-table">
                  <thead>
                    <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                      <th className="px-4 py-2 text-left font-medium">{tp.symbol}</th>
                      <th className="px-3 py-2 text-right font-medium">{tp.qty}</th>
                      <th className="px-3 py-2 text-left font-medium">{tp.statusCol}</th>
                      <th className="px-3 py-2 text-left font-medium">{tp.source}</th>
                      <th className="px-3 py-2 text-left font-medium">{tp.price}</th>
                      <th className="px-3 py-2 text-left font-medium">{tp.priceDate}</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map(r => (
                      <PriceRowView key={`${year}-${r.symbol}`} t={t} f={f} year={year} row={r} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function PriceRowView({ t, f, year, row }: { t: ReturnsDict; f: ReturnType<typeof makeFormat>; year: number; row: PriceRow }) {
  const router = useRouter()
  const tp = t.prices
  const [price, setPrice] = useState(row.price !== null ? String(row.price) : '')
  const [date, setDate] = useState(row.priceDate ?? `${year}-12-31`)
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    const ok = await runAction(
      () => saveYearEndPrice({ symbol: row.symbol, year, price: Number(price), priceDate: date }),
      tp.saved
    )
    setBusy(false)
    if (ok) router.refresh()
  }

  const input =
    'w-full min-w-[7rem] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-2.5 py-1.5 text-sm text-gray-900 dark:text-white disabled:opacity-60'

  return (
    <tr data-testid={`prices-row-${row.symbol}`} className="border-b last:border-0 border-gray-50 dark:border-gray-800/60 text-gray-700 dark:text-gray-300">
      <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-white">{row.symbol}</td>
      <td className="px-3 py-2.5 text-right tabular-nums">{f.num(row.qty)}</td>
      <td className="px-3 py-2.5">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[row.status]}`} data-testid={`prices-status-${row.symbol}`}>
          {tp[row.status]}
        </span>
      </td>
      <td className="px-3 py-2.5 text-xs">{row.source ? tp[row.source] : '—'}</td>
      <td className="px-3 py-2.5">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={price}
          onChange={e => setPrice(e.target.value)}
          disabled={!row.editable || busy}
          aria-label={`${tp.price} ${row.symbol}`}
          data-testid={`prices-input-${row.symbol}`}
          className={input}
        />
      </td>
      <td className="px-3 py-2.5">
        <input
          type="date"
          value={date}
          min={`${year}-01-01`}
          max={`${year}-12-31`}
          onChange={e => setDate(e.target.value)}
          disabled={!row.editable || busy}
          aria-label={`${tp.priceDate} ${row.symbol}`}
          data-testid={`prices-date-${row.symbol}`}
          className={input}
        />
      </td>
      <td className="px-4 py-2.5 text-right">
        {row.editable ? (
          <button
            type="button"
            onClick={save}
            disabled={busy || !price}
            data-testid={`prices-save-${row.symbol}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {busy ? tp.saving : tp.save}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400" title={t.errors.locked}>
            <Lock className="w-3.5 h-3.5" /> {tp.locked}
          </span>
        )}
      </td>
    </tr>
  )
}
