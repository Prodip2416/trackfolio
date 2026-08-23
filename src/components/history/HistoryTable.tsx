'use client'

import { Loader2, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

type Transaction = {
  id: string
  type: 'BUY' | 'SELL'
  quantity: number
  price_per_unit: number
  transaction_date: string
  brokerage_fee: number
  stocks: {
    symbol: string
    company_name: string
  }
}

type Dividend = {
  id: string
  type: 'INTERIM' | 'FINAL'
  cash_amount: number | null
  bonus_quantity: number | null
  date: string
  stocks: {
    symbol: string
    company_name: string
  }
}

interface HistoryTableProps {
  data: any[]
  activeTab: 'BUY' | 'SELL' | 'DIVIDEND'
  isLoading: boolean
  currentPage: number
  totalPages: number
  setCurrentPage: (page: number | ((p: number) => number)) => void
  setEditTransaction: (txn: any) => void
  setEditDividend: (div: any) => void
  setDeleteId: (id: string) => void
  setDeleteType: (type: 'TRANSACTION' | 'DIVIDEND') => void
  isDeleting: boolean
}

export default function HistoryTable({
  data,
  activeTab,
  isLoading,
  currentPage,
  totalPages,
  setCurrentPage,
  setEditTransaction,
  setEditDividend,
  setDeleteId,
  setDeleteType,
  isDeleting
}: HistoryTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      {/* Loading Blur Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] rounded-b-2xl transition-all duration-300">
          <div className="flex flex-col items-center bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-slate-700">
            <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mb-2" />
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Loading records...</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800 transition-colors relative">
          <thead className="bg-gray-100/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 transition-colors sticky top-0 z-20 shadow-sm backdrop-blur-md">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Stock</th>
              <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Date</th>
              {activeTab === 'DIVIDEND' ? (
                <>
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Cash (৳)</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Bonus Shares</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Actions</th>
                </>
              ) : (
                <>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Quantity</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Price (৳)</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider hidden sm:table-cell">Fee (৳)</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Total (৳)</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Actions</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800 transition-colors">
            {activeTab === 'DIVIDEND' ? (
              // DIVIDEND TABLE ROWS
              data.length > 0 ? (
                (data as Dividend[]).map((div) => (
                  <tr key={div.id} className="even:bg-gray-50/60 dark:even:bg-slate-800/40 odd:bg-white dark:odd:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-slate-800/80 transition-colors group">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-xs font-bold text-gray-900 dark:text-white">{div.stocks?.symbol}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[150px] hidden md:block">{div.stocks?.company_name}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {div.date ? formatDate(div.date) : '-'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                        div.type === 'INTERIM' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {div.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-green-600 dark:text-green-400 text-right font-medium">
                      {div.cash_amount ? `৳${div.cash_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs font-bold text-gray-900 dark:text-white text-right">
                      {div.bonus_quantity ? `+${div.bonus_quantity.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-xs font-medium">
                      <div className="flex items-center justify-end space-x-3 transition-opacity">
                        <button
                          onClick={() => setEditDividend({
                            id: div.id,
                            symbol: div.stocks?.symbol,
                            type: div.type,
                            year: (div as any).year?.toString(),
                            cash_amount: div.cash_amount,
                            bonus_quantity: div.bonus_quantity,
                            date: div.date,
                            note: (div as any).note || ''
                          })}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                          title="Edit Dividend"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setDeleteId(div.id); setDeleteType('DIVIDEND'); }}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50 cursor-pointer"
                          title="Delete Dividend"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {isLoading ? '' : 'No dividend records match your current filters.'}
                  </td>
                </tr>
              )
            ) : (
              // TRANSACTION TABLE ROWS
              data.length > 0 ? (
                (data as Transaction[]).map((txn) => {
                  if (txn.quantity === undefined) return null; // Defensive check to avoid rendering mismatched data
                  const total = (txn.quantity * txn.price_per_unit) + (txn.type === 'BUY' ? txn.brokerage_fee : -txn.brokerage_fee)
                  return (
                    <tr key={txn.id} className="even:bg-gray-50/60 dark:even:bg-slate-800/40 odd:bg-white dark:odd:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-slate-800/80 transition-colors group">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-xs font-bold text-gray-900 dark:text-white">{txn.stocks?.symbol}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[150px] hidden md:block">{txn.stocks?.company_name}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {txn.transaction_date ? formatDate(txn.transaction_date) : '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white text-right font-medium">
                        {txn.quantity?.toLocaleString() ?? '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white text-right">
                        {txn.price_per_unit?.toFixed(2) ?? '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 text-right hidden sm:table-cell">
                        {txn.brokerage_fee?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs font-bold text-gray-900 dark:text-white text-right">
                        {total ? total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-xs font-medium">
                        <div className="flex items-center justify-end space-x-3 transition-opacity">
                          <button
                            onClick={() => setEditTransaction({
                              id: txn.id,
                              symbol: txn.stocks?.symbol,
                              company_name: txn.stocks?.company_name,
                              type: txn.type,
                              quantity: txn.quantity,
                              price_per_unit: txn.price_per_unit,
                              transaction_date: txn.transaction_date,
                              brokerage_fee: txn.brokerage_fee || 0,
                              note: (txn as any).note || ''
                            })}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                            title="Edit Transaction"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setDeleteId(txn.id); setDeleteType('TRANSACTION'); }}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {isLoading ? '' : `No ${activeTab.toLowerCase()} transactions match your current filters.`}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="bg-gray-50/50 dark:bg-slate-900/50 px-6 py-4 border-t border-gray-100 dark:border-slate-800 rounded-b-2xl flex items-center justify-between transition-colors shrink-0">
        <div className="hidden sm:block">
          <p className="text-[13px] text-gray-500 dark:text-gray-400">
            Showing page <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
          </p>
        </div>
        <div className="flex-1 flex justify-between sm:justify-end gap-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1 || isLoading}
            className="relative inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>

          {/* Page Numbers */}
          <div className="hidden sm:flex items-center gap-1 mx-2">
            {(() => {
              const pages = [];
              if (totalPages <= 5) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                if (currentPage <= 3) {
                  pages.push(1, 2, 3, 4, '...', totalPages);
                } else if (currentPage >= totalPages - 2) {
                  pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                } else {
                  pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                }
              }
              return pages.map((page, index) => {
                if (page === '...') {
                  return <span key={`ellipsis-${index}`} className="px-2 text-gray-400">...</span>
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page as number)}
                    disabled={isLoading}
                    className={`relative inline-flex items-center justify-center min-w-[32px] h-8 px-1 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                      page === currentPage
                        ? 'bg-indigo-600 text-white shadow-sm border border-indigo-600'
                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-transparent hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              });
            })()}
          </div>

          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || isLoading}
            className="relative inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  )
}
