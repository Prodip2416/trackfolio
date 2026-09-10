'use client'

import { useState } from 'react'
import { Plus, Trash2, Pencil, Calendar, CalendarDays, CalendarRange, Sun, Clock, Timer, Zap } from 'lucide-react'
import DividendForm from '@/components/dividends/DividendForm'
import { deleteDividend } from '@/app/dividends/actions'
import ConfirmModal from '@/components/shared/ConfirmModal'
import SearchableDropdown from '@/components/shared/SearchableDropdown'

type Dividend = {
  id: string
  type: 'INTERIM' | 'FINAL'
  year: number
  percentage: number | null
  cash_amount: number | null
  bonus_quantity: number | null
  date: string
  note: string | null
  stocks: {
    symbol: string
    company_name: string
  }
}

export default function DividendsClient({ initialDividends, dict }: { initialDividends: Dividend[], dict?: any }) {
  const t = dict?.confirm || {}
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editDividend, setEditDividend] = useState<any>(null)
  const [deleteDividendId, setDeleteDividendId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const confirmDelete = async () => {
    if (!deleteDividendId) return
    setIsDeleting(true)
    await deleteDividend(deleteDividendId)
    setIsDeleting(false)
    setDeleteDividendId(null)
  }

  const availableYears = Array.from(new Set(initialDividends.map(d => d.year))).sort((a, b) => b - a)
  const currentYear = new Date().getFullYear().toString()
  const [selectedYear, setSelectedYear] = useState<string>(availableYears.length > 0 ? availableYears[0].toString() : currentYear)
  
  const filteredDividends = selectedYear === 'All' 
    ? initialDividends 
    : initialDividends.filter(d => d.year.toString() === selectedYear)
    
  const totalCash = filteredDividends.reduce((sum, div) => sum + (div.cash_amount || 0), 0)
  
  const yearly = totalCash
  const monthly = totalCash / 12
  const weekly = totalCash / 52.1429
  const daily = totalCash / 365.25
  const hourly = daily / 24
  const perMin = hourly / 60
  const perSec = perMin / 60

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-120px)] space-y-4">
      {/* Header Action Row */}
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filter Year:</span>
          <div className="min-w-[140px]">
            <SearchableDropdown
              options={[
                { label: 'All Time', value: 'All' },
                ...availableYears.map(year => ({ label: year.toString(), value: year.toString() }))
              ]}
              value={selectedYear}
              onChange={setSelectedYear}
              placeholder="Select Year"
              searchPlaceholder="Search year..."
              buttonClassName="px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm text-sm font-medium text-gray-900 dark:text-white min-h-[38px] w-full text-left"
            />
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          {dict?.dividends?.addDividend || 'Add'}
        </button>
      </div>

      {/* Dividend Breakdown Card */}
      <div className="shrink-0 mb-1">
        <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
          {selectedYear === 'All' ? 'Passive Income Speed (All Time Base)' : `Passive Income Speed (${selectedYear})`}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Yearly */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 shadow-sm text-white relative overflow-hidden group">
            <Calendar className="absolute right-[-10px] bottom-[-10px] w-16 h-16 text-white/20 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-white/95 mb-1 relative z-10 uppercase tracking-wide">Yearly</p>
            <p className="text-lg font-extrabold text-white relative z-10">৳{yearly.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
          
          {/* Monthly */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 shadow-sm text-white relative overflow-hidden group">
            <CalendarDays className="absolute right-[-10px] bottom-[-10px] w-16 h-16 text-white/20 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-white/95 mb-1 relative z-10 uppercase tracking-wide">Monthly</p>
            <p className="text-lg font-extrabold text-white relative z-10">৳{monthly.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>

          {/* Weekly */}
          <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-4 shadow-sm text-white relative overflow-hidden group">
            <CalendarRange className="absolute right-[-10px] bottom-[-10px] w-16 h-16 text-white/20 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-white/95 mb-1 relative z-10 uppercase tracking-wide">Weekly</p>
            <p className="text-lg font-extrabold text-white relative z-10">৳{weekly.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>

          {/* Daily */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 shadow-sm text-white relative overflow-hidden group">
            <Sun className="absolute right-[-10px] bottom-[-10px] w-16 h-16 text-white/20 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-white/95 mb-1 relative z-10 uppercase tracking-wide">Daily</p>
            <p className="text-lg font-extrabold text-white relative z-10">৳{daily.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>

          {/* Hourly */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 shadow-sm text-white relative overflow-hidden group">
            <Clock className="absolute right-[-10px] bottom-[-10px] w-16 h-16 text-white/20 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-white/95 mb-1 relative z-10 uppercase tracking-wide">Hourly</p>
            <p className="text-lg font-extrabold text-white relative z-10">৳{hourly.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>

          {/* Per Min */}
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-4 shadow-sm text-white relative overflow-hidden group">
            <Timer className="absolute right-[-10px] bottom-[-10px] w-16 h-16 text-white/20 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-white/95 mb-1 relative z-10 uppercase tracking-wide">Per Min</p>
            <p className="text-lg font-extrabold text-white relative z-10">৳{perMin.toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 4})}</p>
          </div>

          {/* Per Sec */}
          <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-4 shadow-sm text-white relative overflow-hidden group">
            <Zap className="absolute right-[-10px] bottom-[-10px] w-16 h-16 text-white/20 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-white/95 mb-1 relative z-10 uppercase tracking-wide">Per Sec</p>
            <p className="text-lg font-extrabold text-white relative z-10">৳{perSec.toLocaleString(undefined, {minimumFractionDigits: 6, maximumFractionDigits: 6})}</p>
          </div>
        </div>
      </div>

      {/* Dividends Table */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0 transition-colors">
          {filteredDividends.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{dict?.dividends?.noDividends || 'No dividends found'}</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6 max-w-sm mx-auto">
                {dict?.dividends?.noDividendsDesc || 'Keep track of your cash and stock dividends.'}
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                {dict?.dividends?.logFirst || 'Log Dividend'}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-6 py-3 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 shrink-0 transition-colors">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{dict?.dividends?.latest10 || 'Dividend Records'}</h3>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800 relative transition-colors">
                  <thead className="bg-gray-100/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm transition-colors backdrop-blur-md">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">
                      Stock
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">
                      Date & Year
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">
                      Cash (৳)
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">
                      Bonus Qty
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800 transition-colors">
                  {filteredDividends.map((div) => {
                    return (
                      <tr key={div.id} className="even:bg-gray-50/60 dark:even:bg-slate-800/40 odd:bg-white dark:odd:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-slate-800/80 transition-colors group">
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-xs font-bold text-gray-900 dark:text-white">{div.stocks?.symbol}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{div.stocks?.company_name}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs">
                          <div className="font-medium text-gray-900 dark:text-white">{new Date(div.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">{div.year}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                            div.type === 'FINAL' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                            {div.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white text-right">
                          {div.cash_amount ? div.cash_amount.toFixed(2) : '-'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white text-right">
                          {div.bonus_quantity ? div.bonus_quantity.toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-xs font-medium">
                          <div className="flex items-center justify-end space-x-3">
                            <button
                              onClick={() => setEditDividend({
                                id: div.id,
                                symbol: div.stocks?.symbol,
                                company_name: div.stocks?.company_name,
                                type: div.type,
                                year: div.year,
                                cash_amount: div.cash_amount,
                                bonus_quantity: div.bonus_quantity,
                                date: div.date,
                                note: div.note
                              })}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors disabled:opacity-50"
                              title="Edit Dividend"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteDividendId(div.id)}
                              disabled={deleteDividendId === div.id && isDeleting}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                              title="Delete Dividend"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            </div>
          )}
        </div>

      {isAddModalOpen && (
        <DividendForm onClose={() => setIsAddModalOpen(false)} />
      )}

      {editDividend && (
        <DividendForm 
          onClose={() => setEditDividend(null)} 
          initialData={editDividend} 
        />
      )}

      <ConfirmModal
        isOpen={!!deleteDividendId}
        title={t.deleteDividendTitle || 'Delete Dividend'}
        message={t.deleteDividendMessage || 'Are you sure you want to delete this dividend record? This action cannot be undone.'}
        confirmText={t.delete || 'Delete'}
        cancelText={t.cancel || 'Cancel'}
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteDividendId(null)}
        dict={dict}
      />
    </div>
  )
}
