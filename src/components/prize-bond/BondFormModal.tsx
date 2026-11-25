'use client'

import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { MAX_BONDS_PER_OPERATION, expandBondRange, extractBondNumbers, normalizeBondNumber } from '@/lib/prize-bond/core'
import type { BondRow } from '@/lib/prize-bond/service'
import { addBonds, updateBond, type AddBondsResult } from '@/app/prize-bond/actions'
import { Modal, btnPrimary, btnSecondary, callAction, fmt, inputCls, labelCls, type PrizeBondDict } from './shared'

type Mode = 'single' | 'range' | 'paste'

export function rangeError(t: PrizeBondDict, from: string, to: string): string | null {
  try {
    expandBondRange(from, to)
    return null
  } catch (e) {
    const code = (e as Error).message
    if (code === 'RANGE_REVERSED') return t.errors.rangeReversed
    if (code === 'RANGE_TOO_LARGE') return fmt(t.errors.tooMany, { max: MAX_BONDS_PER_OPERATION })
    return t.errors.invalidNumber
  }
}

export function toastAddResult(t: PrizeBondDict, r: AddBondsResult) {
  toast.success(fmt(t.toast.added, { added: r.added }))
  if (r.skipped > 0) toast(fmt(t.toast.skipped, { skipped: r.skipped }), { icon: 'ℹ️' })
}

export default function BondFormModal({
  t,
  bond,
  onClose,
  onSaved
}: {
  t: PrizeBondDict
  bond: BondRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!bond
  const [mode, setMode] = useState<Mode>('single')
  const [number, setNumber] = useState(bond?.number ?? '')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [paste, setPaste] = useState('')
  const [series, setSeries] = useState(bond?.series ?? '')
  const [holder, setHolder] = useState(bond?.holder ?? '')
  const [purchaseDate, setPurchaseDate] = useState(bond?.purchase_date ?? '')
  const [encashedOn, setEncashedOn] = useState(bond?.encashed_on ?? '')
  const [note, setNote] = useState(bond?.note ?? '')
  const [saving, setSaving] = useState(false)

  const rangeInfo = useMemo(() => {
    if (!from || !to) return null
    const err = rangeError(t, from, to)
    return err ? { err } : { count: Number(normalizeBondNumber(to)) - Number(normalizeBondNumber(from)) + 1 }
  }, [from, to, t])
  const pasteInfo = useMemo(() => (paste.trim() ? extractBondNumbers(paste) : null), [paste])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const common = { series: series || null, holder: holder || null, purchase_date: purchaseDate || null, note: note || null }

    if (isEdit) {
      setSaving(true)
      const r = await callAction(() => updateBond({ id: bond.id, number, ...common, encashed_on: encashedOn || null }), {
        success: t.toast.updated,
        fallback: t.errors.saveFailed
      })
      setSaving(false)
      if (r) onSaved()
      return
    }

    let numbers: string[]
    if (mode === 'single') {
      const n = normalizeBondNumber(number)
      if (!n) return toast.error(t.errors.invalidNumber)
      numbers = [n]
    } else if (mode === 'range') {
      const err = rangeError(t, from, to)
      if (err) return toast.error(err)
      numbers = expandBondRange(from, to)
    } else {
      numbers = pasteInfo?.numbers ?? []
      if (numbers.length === 0) return toast.error(t.errors.noValidNumbers)
    }

    setSaving(true)
    const result = await callAction(() => addBonds({ items: numbers.map(n => ({ number: n })), ...common }), { fallback: t.errors.saveFailed })
    setSaving(false)
    if (result) {
      toastAddResult(t, result)
      onSaved()
    }
  }

  const modes: [Mode, string][] = [
    ['single', t.form.modeSingle],
    ['range', t.form.modeRange],
    ['paste', t.form.modePaste]
  ]

  return (
    <Modal title={isEdit ? t.form.editTitle : t.form.addTitle} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" data-testid="pb-bond-form">
        {!isEdit && (
          <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
            {modes.map(([m, label]) => (
              <button
                key={m}
                type="button"
                data-testid={`pb-mode-${m}`}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer ${
                  mode === m ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {(isEdit || mode === 'single') && (
          <div>
            <label className={labelCls} htmlFor="pb-number">
              {t.common.number}
            </label>
            <input
              id="pb-number"
              value={number}
              onChange={e => setNumber(e.target.value)}
              inputMode="numeric"
              placeholder="0544222"
              className={`${inputCls} font-mono`}
              autoFocus
              required
            />
          </div>
        )}

        {!isEdit && mode === 'range' && (
          <div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="pb-from">
                  {t.form.from}
                </label>
                <input id="pb-from" value={from} onChange={e => setFrom(e.target.value)} inputMode="numeric" placeholder="0622201" className={`${inputCls} font-mono`} required />
              </div>
              <div>
                <label className={labelCls} htmlFor="pb-to">
                  {t.form.to}
                </label>
                <input id="pb-to" value={to} onChange={e => setTo(e.target.value)} inputMode="numeric" placeholder="0622300" className={`${inputCls} font-mono`} required />
              </div>
            </div>
            {rangeInfo && (
              <p className={`mt-1.5 text-xs ${'err' in rangeInfo ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`} data-testid="pb-range-info">
                {'err' in rangeInfo ? rangeInfo.err : fmt(t.form.rangeCount, { count: rangeInfo.count })}
              </p>
            )}
          </div>
        )}

        {!isEdit && mode === 'paste' && (
          <div>
            <label className={labelCls} htmlFor="pb-paste">
              {t.form.pasteLabel}
            </label>
            <textarea id="pb-paste" value={paste} onChange={e => setPaste(e.target.value)} rows={6} className={`${inputCls} font-mono`} required />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t.form.pasteHint}</p>
            {pasteInfo && (
              <p className="mt-1 text-xs font-medium text-gray-700 dark:text-gray-300" data-testid="pb-paste-info">
                {fmt(t.form.pastePreview, { valid: pasteInfo.numbers.length, invalid: pasteInfo.invalid.length, dup: pasteInfo.duplicates })}
              </p>
            )}
          </div>
        )}

        {!isEdit && <p className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-slate-800 pt-3">{t.form.commonHint}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="pb-series">
              {t.common.series} <span className="font-normal text-gray-400">({t.common.optional})</span>
            </label>
            <input id="pb-series" value={series} onChange={e => setSeries(e.target.value)} placeholder={t.form.seriesPlaceholder} maxLength={4} className={inputCls} />
            <p className="mt-1 text-[11px] text-gray-400">{t.form.seriesHint}</p>
          </div>
          <div>
            <label className={labelCls} htmlFor="pb-holder">
              {t.common.holder} <span className="font-normal text-gray-400">({t.common.optional})</span>
            </label>
            <input id="pb-holder" value={holder} onChange={e => setHolder(e.target.value)} maxLength={100} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="pb-purchase">
              {t.common.purchaseDate} <span className="font-normal text-gray-400">({t.common.optional})</span>
            </label>
            <input id="pb-purchase" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className={inputCls} />
          </div>
          {isEdit && (
            <div>
              <label className={labelCls} htmlFor="pb-encashed">
                {t.common.encashedOn} <span className="font-normal text-gray-400">({t.common.optional})</span>
              </label>
              <input id="pb-encashed" type="date" value={encashedOn} onChange={e => setEncashedOn(e.target.value)} className={inputCls} />
            </div>
          )}
        </div>
        <div>
          <label className={labelCls} htmlFor="pb-note">
            {t.common.note} <span className="font-normal text-gray-400">({t.common.optional})</span>
          </label>
          <input id="pb-note" value={note} onChange={e => setNote(e.target.value)} maxLength={500} className={inputCls} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btnSecondary} onClick={onClose} disabled={saving}>
            {t.common.cancel}
          </button>
          <button type="submit" className={btnPrimary} disabled={saving} data-testid="pb-bond-save">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? t.common.saving : t.common.save}
          </button>
        </div>
      </form>
    </Modal>
  )
}
