'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import PremiumDatePicker from '@/components/shared/PremiumDatePicker'
import { runAction } from '@/lib/run-action'
import { planCost, roundTrip } from '@/lib/planner-calc'
import { saveTradePlan, type TradePlan, type PlanStatus } from '@/app/planner/actions'
import { Modal, StockPicker, fmtTk, inputCls, labelCls, numOrNull, type PickedCompany } from './shared'

export type PlanPrefill = {
  company: PickedCompany
  type: 'BUY' | 'SELL'
  price: number
  quantity: number
  commission_pct: number
  target_price?: number | null
}

const STATUS_OPTIONS: { value: PlanStatus; label: string }[] = [
  { value: 'IDEA', label: '💡 Idea' },
  { value: 'ACTIVE', label: '🎯 Active' },
  { value: 'EXECUTED', label: '✅ Executed' },
  { value: 'CANCELLED', label: '❌ Cancelled' }
]

const str = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n))

export default function PlanFormModal({
  plan,
  prefill,
  defaultCommissionPct,
  onClose
}: {
  plan?: TradePlan
  prefill?: PlanPrefill
  defaultCommissionPct: number
  onClose: () => void
}) {
  const router = useRouter()
  const [company, setCompany] = useState<PickedCompany | null>(
    plan ? { symbol: plan.symbol, company_name: plan.company_name, current_price: plan.current_price } : prefill?.company ?? null
  )
  const [type, setType] = useState<'BUY' | 'SELL'>(plan?.type ?? prefill?.type ?? 'BUY')
  const [price, setPrice] = useState(str(plan?.price ?? prefill?.price))
  const [quantity, setQuantity] = useState(str(plan?.quantity ?? prefill?.quantity))
  const [commission, setCommission] = useState(str(plan?.commission_pct ?? prefill?.commission_pct ?? defaultCommissionPct))
  const [stopLoss, setStopLoss] = useState(str(plan?.stop_loss))
  const [target, setTarget] = useState(str(plan?.target_price ?? prefill?.target_price))
  const [reason, setReason] = useState(plan?.reason ?? '')
  const [status, setStatus] = useState<PlanStatus>(plan?.status ?? 'IDEA')
  const [reviewDate, setReviewDate] = useState(plan?.review_date ?? '')
  const [saving, setSaving] = useState(false)

  const p = numOrNull(price)
  const q = numOrNull(quantity)
  const c = numOrNull(commission) ?? 0
  const cost = p && q && p > 0 && q > 0 ? planCost(type, p, q, c) : null
  const t = numOrNull(target)
  const projected = type === 'BUY' && cost && t && t > 0 && p && q ? roundTrip(p, t, q, c) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company) return toast.error('Please select a stock.')
    if (p === null || p <= 0) return toast.error('Price must be greater than 0.')
    if (q === null || q <= 0 || !Number.isInteger(q)) return toast.error('Quantity must be a whole number greater than 0.')
    if (numOrNull(commission) === null) return toast.error('Please enter Commission % (0 if none).')

    setSaving(true)
    const ok = await runAction(
      () =>
        saveTradePlan({
          id: plan?.id ?? null,
          symbol: company.symbol,
          type,
          price: p,
          quantity: q,
          commission_pct: c,
          stop_loss: numOrNull(stopLoss),
          target_price: t,
          reason,
          status,
          review_date: reviewDate || null
        }),
      plan ? 'Plan updated' : 'Plan saved'
    )
    setSaving(false)
    if (ok) {
      router.refresh()
      onClose()
    }
  }

  return (
    <Modal title={plan ? 'Edit Plan' : 'New Trade Plan'} subtitle="Hypothetical only — nothing is added to your portfolio." onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(['BUY', 'SELL'] as const).map(v => (
            <button
              type="button"
              key={v}
              onClick={() => setType(v)}
              className={`py-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
                type === v
                  ? v === 'BUY'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'border-red-600 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {v === 'BUY' ? 'Buy' : 'Sell'}
            </button>
          ))}
        </div>

        <div>
          <label className={labelCls}>Stock</label>
          <StockPicker value={company} onChange={setCompany} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Price (৳)</label>
            <input type="number" inputMode="decimal" min="0" step="0.1" value={price} onChange={e => setPrice(e.target.value)} placeholder="45.5" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Quantity</label>
            <input type="number" inputMode="numeric" min="1" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="100" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Commission %</label>
            <input type="number" inputMode="decimal" min="0" step="0.01" value={commission} onChange={e => setCommission(e.target.value)} placeholder="0.4" className={inputCls} />
          </div>
        </div>

        {cost && (
          <div className="rounded-xl bg-gray-50 dark:bg-slate-800/60 px-4 py-3 text-sm grid grid-cols-3 gap-2">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Amount</div>
              <div className="font-semibold text-gray-900 dark:text-white">{fmtTk(cost.gross)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Commission</div>
              <div className="font-semibold text-gray-900 dark:text-white">{fmtTk(cost.commission)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{type === 'BUY' ? 'Total to pay' : 'You receive'}</div>
              <div className={`font-bold ${type === 'BUY' ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{fmtTk(cost.net)}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Stop-loss (৳, optional)</label>
            <input type="number" inputMode="decimal" min="0" step="0.1" value={stopLoss} onChange={e => setStopLoss(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{type === 'BUY' ? 'Target sell price' : 'Target price'} (৳, optional)</label>
            <input type="number" inputMode="decimal" min="0" step="0.1" value={target} onChange={e => setTarget(e.target.value)} className={inputCls} />
          </div>
        </div>

        {projected && (
          <p className={`text-xs font-medium ${projected.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            Selling at target → {projected.profit >= 0 ? 'profit' : 'loss'} {fmtTk(Math.abs(projected.profit))} ({projected.returnPct}%) · Breakeven {fmtTk(projected.breakeven)}
          </p>
        )}

        <div>
          <label className={labelCls}>Reason / thesis</label>
          <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Why this plan?" className={`${inputCls} resize-y`} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as PlanStatus)} className={inputCls}>
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Review date (optional)</label>
            <div className="flex gap-2">
              <PremiumDatePicker
                value={reviewDate}
                onChange={setReviewDate}
                placement="top"
                placeholder="No date"
                className="flex-1"
                buttonClassName="px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm min-h-[42px]"
              />
              {reviewDate && (
                <button type="button" onClick={() => setReviewDate('')} className="text-xs text-gray-500 hover:text-red-600 cursor-pointer">
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-70 cursor-pointer"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {plan ? 'Update Plan' : 'Save Plan'}
        </button>
      </form>
    </Modal>
  )
}
