'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { MAX_BONDS_PER_OPERATION, compressToRanges } from '@/lib/prize-bond/core'
import { extractBondsFromRows, templateRows, type ImportColumn, type ImportResult } from '@/lib/prize-bond/import'
import { addBonds } from '@/app/prize-bond/actions'
import { toastAddResult } from './BondFormModal'
import { Modal, btnPrimary, btnSecondary, callAction, fmt, inputCls, labelCls, type PrizeBondDict } from './shared'

export default function ImportModal({ t, onClose, onSaved }: { t: PrizeBondDict; onClose: () => void; onSaved: () => void }) {
  const [result, setResult] = useState<ImportResult | null>(null)
  const [fileName, setFileName] = useState('')
  const [holder, setHolder] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [reading, setReading] = useState(false)
  const [saving, setSaving] = useState(false)

  const columnLabel: Record<ImportColumn, string> = {
    number: t.common.number,
    series: t.common.series,
    holder: t.common.holder,
    purchase_date: t.common.purchaseDate,
    note: t.common.note
  }

  /** Builds the sample .xlsx in the browser: sheet 1 = format (numbers as text), sheet 2 = how to fill. */
  async function downloadTemplate() {
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()
      const sheet = XLSX.utils.aoa_to_sheet(
        templateRows({
          number: t.import.tplNumber,
          series: t.import.tplSeries,
          holder: t.import.tplHolder,
          purchaseDate: t.import.tplDate,
          note: t.import.tplNote,
          sampleNote: t.import.tplSample
        })
      )
      sheet['!cols'] = [{ wch: 16 }, { wch: 24 }, { wch: 22 }, { wch: 34 }, { wch: 32 }]
      XLSX.utils.book_append_sheet(wb, sheet, t.import.tplSheet)
      const help = XLSX.utils.aoa_to_sheet([[t.import.tplHelp1], [t.import.tplHelp2], [t.import.tplHelp3], [t.import.tplHelp4], [t.import.tplHelp5]])
      help['!cols'] = [{ wch: 100 }]
      XLSX.utils.book_append_sheet(wb, help, t.import.tplHelpSheet.slice(0, 31))
      XLSX.writeFile(wb, t.import.templateFile)
    } catch (err) {
      console.error(err)
      toast.error(t.import.readError)
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same (fixed) file
    if (!file) return
    setReading(true)
    setFileName(file.name)
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: '' })
      setResult(extractBondsFromRows(rows))
    } catch (err) {
      console.error(err)
      setResult(null)
      toast.error(t.import.readError)
    } finally {
      setReading(false)
    }
  }

  async function submit() {
    if (!result || result.items.length === 0) return
    if (result.items.length > MAX_BONDS_PER_OPERATION) return toast.error(fmt(t.errors.tooMany, { max: MAX_BONDS_PER_OPERATION }))
    setSaving(true)
    const res = await callAction(() => addBonds({ items: result.items, holder: holder || null, purchase_date: purchaseDate || null }), {
      fallback: t.errors.saveFailed
    })
    setSaving(false)
    if (res) {
      toastAddResult(t, res)
      onSaved()
    }
  }

  const ranges = result ? compressToRanges(result.items.map(i => i.number)) : []

  return (
    <Modal title={t.import.title} subtitle={t.import.hint} onClose={onClose}>
      <div className="space-y-4">
        <button
          type="button"
          onClick={downloadTemplate}
          className="w-full flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-left hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"
          data-testid="pb-import-template"
        >
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-b from-[#34c759] to-[#248a3d] text-white shadow-sm shrink-0">
            <Download className="w-4 h-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-emerald-800 dark:text-emerald-300">{t.import.template}</span>
            <span className="block text-xs text-emerald-700/80 dark:text-emerald-400/80 truncate">
              {t.import.tplNumber} · {t.common.series} · {t.common.holder} · {t.common.purchaseDate} · {t.common.note}
            </span>
          </span>
        </button>

        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-6 cursor-pointer hover:border-indigo-400 transition-colors">
          {reading ? <Loader2 className="w-8 h-8 animate-spin text-indigo-500" /> : <FileSpreadsheet className="w-8 h-8 text-emerald-500" />}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{fileName || t.import.choose}</span>
          <span className="text-xs text-gray-400">.xlsx · .xls · .csv</span>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className="sr-only" data-testid="pb-import-file" />
        </label>

        {result && (
          <div className="rounded-xl bg-gray-50 dark:bg-slate-800/60 p-3 text-sm space-y-1" data-testid="pb-import-summary">
            <p className="font-semibold text-gray-900 dark:text-white">{fmt(t.import.found, { count: result.items.length })}</p>
            <p className="text-xs text-gray-600 dark:text-gray-300" data-testid="pb-import-columns">
              {result.columns.length > 0 ? fmt(t.import.columns, { list: result.columns.map(c => columnLabel[c]).join(', ') }) : t.import.noHeader}
            </p>
            {result.ignored > 0 && <p className="text-xs text-gray-500 dark:text-gray-400">{fmt(t.import.ignored, { count: result.ignored })}</p>}
            {ranges.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-words">
                {ranges
                  .slice(0, 8)
                  .map(r => (r.count > 1 ? `${r.from}–${r.to}` : r.from))
                  .join(', ')}
                {ranges.length > 8 ? ` … (+${ranges.length - 8})` : ''}
              </p>
            )}
          </div>
        )}

        {result && result.items.length > 0 && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="pb-imp-holder">
                  {t.common.holder} <span className="font-normal text-gray-400">({t.common.optional})</span>
                </label>
                <input id="pb-imp-holder" value={holder} onChange={e => setHolder(e.target.value)} maxLength={100} className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="pb-imp-date">
                  {t.common.purchaseDate} <span className="font-normal text-gray-400">({t.common.optional})</span>
                </label>
                <input id="pb-imp-date" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className={inputCls} />
              </div>
            </div>
            <p className="mt-1 text-[11px] text-gray-400">{t.import.rowValuesHint}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btnSecondary} onClick={onClose} disabled={saving}>
            {t.common.cancel}
          </button>
          <button type="button" className={btnPrimary} onClick={submit} disabled={saving || !result || result.items.length === 0} data-testid="pb-import-submit">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {fmt(t.import.submit, { count: result?.items.length ?? 0 })}
          </button>
        </div>
      </div>
    </Modal>
  )
}
