'use client'

import { useState } from 'react'
import { Calculator, TrendingDown, Save } from 'lucide-react'
import { roundTrip, averageDown } from '@/lib/planner-calc'
import type { CalculatorHolding } from '@/app/planner/actions'
import PlanFormModal, { type PlanPrefill } from './PlanFormModal'
import { StockPicker, cardCls, fmtNum, fmtTk, inputCls, labelCls, numOrNull, type PickedCompany } from './shared'

export default function CalculatorClient({
  holdings,
  defaultCommissionPct
}: {
  holdings: CalculatorHolding[]
  defaultCommissionPct: number
}) {
  const [commission, setCommission] = useState(String(defaultCommissionPct))
  const [prefill, setPrefill] = useState<PlanPrefill | null>(null)
  const c = numOrNull(commission)
  const commissionOk = c !== null && c >= 0 && c < 100

  return (
    <div className="max-w-7xl mx-auto space-y-5 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">What-If Calculator</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try numbers before you trade. Nothing is saved unless you click “Save as plan”.</p>
        </div>
        <div className="w-40">
          <label className={labelCls}>Commission % (both legs)</label>
          <input type="number" inputMode="decimal" min="0" step="0.01" value={commission} onChange={e => setCommission(e.target.value)} className={inputCls} />
        </div>
      </div>

      {!commissionOk && <p className="text-sm text-red-600 dark:text-red-400">Enter a valid commission % (0 if none).</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        <BuySellCalc commissionPct={commissionOk ? c : 0} onSave={setPrefill} />
        <AverageDownCalc holdings={holdings} commissionPct={commissionOk ? c : 0} onSave={setPrefill} />
      </div>

      {prefill && <PlanFormModal prefill={prefill} defaultCommissionPct={prefill.commission_pct} onClose={() => setPrefill(null)} />}
    </div>
  )
}

function Row({ label, value, cls = '' }: { label: string; value: string; cls?: string }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-sm border-b border-gray-100 dark:border-slate-800 last:border-0">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-semibold text-gray-900 dark:text-white ${cls}`}>{value}</span>
    </div>
  )
}

function BuySellCalc({ commissionPct, onSave }: { commissionPct: number; onSave: (p: PlanPrefill) => void }) {
  const [company, setCompany] = useState<PickedCompany | null>(null)
  const [buy, setBuy] = useState('')
  const [sell, setSell] = useState('')
  const [qty, setQty] = useState('')

  const b = numOrNull(buy)
  const s = numOrNull(sell)
  const q = numOrNull(qty)
  const valid = b !== null && b > 0 && s !== null && s > 0 && q !== null && q > 0 && Number.isInteger(q)
  const r = valid ? roundTrip(b, s, q, commissionPct) : null

  const pickCompany = (co: PickedCompany | null) => {
    setCompany(co)
    if (co?.current_price && !buy) setBuy(String(co.current_price))
  }

  return (
    <div className={`${cardCls} p-5 space-y-4`}>
      <div className="flex items-center gap-2">
        <Calculator className="w-5 h-5 text-indigo-600" />
        <h2 className="font-bold text-gray-900 dark:text-white">Buy → Sell profit</h2>
      </div>
      <div>
        <label className={labelCls}>Stock (optional — fills current price)</label>
        <StockPicker value={company} onChange={pickCompany} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Buy price (৳)</label>
          <input type="number" inputMode="decimal" min="0" step="0.1" value={buy} onChange={e => setBuy(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Sell price (৳)</label>
          <input type="number" inputMode="decimal" min="0" step="0.1" value={sell} onChange={e => setSell(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Quantity</label>
          <input type="number" inputMode="numeric" min="1" step="1" value={qty} onChange={e => setQty(e.target.value)} className={inputCls} />
        </div>
      </div>

      {q !== null && !Number.isInteger(q) && <p className="text-xs text-red-600">Quantity must be a whole number.</p>}

      {r ? (
        <div>
          <Row label="Buy cost (incl. commission)" value={fmtTk(r.buyCost)} />
          <Row label="Sell proceeds (after commission)" value={fmtTk(r.sellProceeds)} />
          <Row label="Total commission" value={fmtTk(r.totalCommission)} />
          <Row label="Breakeven sell price" value={fmtTk(r.breakeven)} />
          <Row
            label={r.profit >= 0 ? 'Net profit' : 'Net loss'}
            value={`${fmtTk(Math.abs(r.profit))} (${r.returnPct > 0 ? '+' : ''}${r.returnPct}%)`}
            cls={r.profit >= 0 ? '!text-emerald-600 dark:!text-emerald-400' : '!text-red-600 dark:!text-red-400'}
          />
        </div>
      ) : (
        <p className="text-sm text-gray-400">Enter buy price, sell price and quantity.</p>
      )}

      <button
        type="button"
        disabled={!r || !company}
        onClick={() =>
          company && b && q && onSave({ company, type: 'BUY', price: b, quantity: q, commission_pct: commissionPct, target_price: s })
        }
        title={!company ? 'Pick a stock to save as a plan' : undefined}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <Save className="w-4 h-4" /> Save as plan
      </button>
    </div>
  )
}

function AverageDownCalc({
  holdings,
  commissionPct,
  onSave
}: {
  holdings: CalculatorHolding[]
  commissionPct: number
  onSave: (p: PlanPrefill) => void
}) {
  const [symbol, setSymbol] = useState('')
  const [holdQty, setHoldQty] = useState('')
  const [holdAvg, setHoldAvg] = useState('')
  const [addQty, setAddQty] = useState('')
  const [addPrice, setAddPrice] = useState('')

  const selected = holdings.find(h => h.symbol === symbol) ?? null

  const pick = (sym: string) => {
    setSymbol(sym)
    const h = holdings.find(x => x.symbol === sym)
    if (h) {
      setHoldQty(String(h.quantity))
      setHoldAvg(String(h.average_price))
      if (h.current_price) setAddPrice(String(h.current_price))
    }
  }

  const hq = numOrNull(holdQty)
  const ha = numOrNull(holdAvg)
  const aq = numOrNull(addQty)
  const ap = numOrNull(addPrice)
  const valid =
    hq !== null && hq >= 0 && ha !== null && ha >= 0 && aq !== null && aq > 0 && Number.isInteger(aq) && ap !== null && ap > 0
  const r = valid ? averageDown(hq, ha, aq, ap, commissionPct) : null

  return (
    <div className={`${cardCls} p-5 space-y-4`}>
      <div className="flex items-center gap-2">
        <TrendingDown className="w-5 h-5 text-indigo-600" />
        <h2 className="font-bold text-gray-900 dark:text-white">Average down / up</h2>
      </div>
      <div>
        <label className={labelCls}>From my portfolio (optional)</label>
        <select value={symbol} onChange={e => pick(e.target.value)} className={inputCls}>
          <option value="">— Enter manually —</option>
          {holdings.map(h => (
            <option key={h.symbol} value={h.symbol}>
              {h.symbol} · {fmtNum(h.quantity)} @ {fmtTk(h.average_price)}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Shares I hold</label>
          <input type="number" inputMode="numeric" min="0" step="1" value={holdQty} onChange={e => setHoldQty(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>My average price (৳)</label>
          <input type="number" inputMode="decimal" min="0" step="0.01" value={holdAvg} onChange={e => setHoldAvg(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Buy more (qty)</label>
          <input type="number" inputMode="numeric" min="1" step="1" value={addQty} onChange={e => setAddQty(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>At price (৳)</label>
          <input type="number" inputMode="decimal" min="0" step="0.1" value={addPrice} onChange={e => setAddPrice(e.target.value)} className={inputCls} />
        </div>
      </div>

      {r ? (
        <div>
          <Row label="Extra cost (incl. commission)" value={fmtTk(r.addCost)} />
          <Row label="New total shares" value={fmtNum(r.newQty)} />
          <Row label="New total cost" value={fmtTk(r.totalCost)} />
          <Row
            label="New average price"
            value={`${fmtTk(r.newAvg)} (${r.avgChange > 0 ? '+' : ''}${fmtNum(r.avgChange)})`}
            cls={r.avgChange <= 0 ? '!text-emerald-600 dark:!text-emerald-400' : '!text-amber-600 dark:!text-amber-400'}
          />
          {selected?.current_price ? <Row label="Current market price" value={fmtTk(selected.current_price)} /> : null}
        </div>
      ) : (
        <p className="text-sm text-gray-400">Enter your holding and how many more you want to buy.</p>
      )}

      <button
        type="button"
        disabled={!r || !selected}
        onClick={() =>
          selected &&
          aq &&
          ap &&
          onSave({
            company: { symbol: selected.symbol, company_name: selected.company_name, current_price: selected.current_price },
            type: 'BUY',
            price: ap,
            quantity: aq,
            commission_pct: commissionPct
          })
        }
        title={!selected ? 'Pick a stock from your portfolio to save as a plan' : undefined}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <Save className="w-4 h-4" /> Save as plan
      </button>
    </div>
  )
}
