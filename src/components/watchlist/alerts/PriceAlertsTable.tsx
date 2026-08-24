'use client'

import { useState } from 'react'
import { Bell, Plus, Pencil, Trash2, Loader2, TrendingUp, TrendingDown, CheckCircle2, Minus, ChevronLeft, ChevronRight } from 'lucide-react'

type PriceAlert = {
  id: string
  symbol: string
  company_name: string
  sector: string
  current_price: number | null
  buy_min_price: number | null
  buy_max_price: number | null
  sell_min_price: number | null
  sell_max_price: number | null
  is_buy_triggered: boolean
  is_sell_triggered: boolean
  buy_status: 'in_range' | 'below_range' | 'above_range' | 'none'
  sell_status: 'in_range' | 'below_range' | 'above_range' | 'none'
  created_at: string
}

type WatchlistSymbol = {
  symbol: string
  company_name: string
  current_price: number | null
}

interface PriceAlertsTableProps {
  alerts: PriceAlert[]
  watchlistSymbols: WatchlistSymbol[]
  openAddModal: () => void
  openEditModal: (alert: PriceAlert) => void
  setDeleteItem: (item: {id: string, symbol: string}) => void
  deletingId: string | null
  dict?: any
}

export default function PriceAlertsTable({
  alerts,
  watchlistSymbols,
  openAddModal,
  openEditModal,
  setDeleteItem,
  deletingId,
  dict
}: PriceAlertsTableProps) {
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(alerts.length / itemsPerPage))
  
  if (currentPage > totalPages) {
    setCurrentPage(totalPages)
  }
  
  const currentAlerts = alerts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const formatPrice = (price: number | null) => {
    if (price === null) return '—'
    return `৳${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getStatusBadge = (status: string, type: 'buy' | 'sell') => {
    if (status === 'none') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <Minus className="w-3 h-3 mr-1" /> Not Set
        </span>
      )
    }
    if (status === 'in_range') {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${type === 'buy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
          <CheckCircle2 className="w-3 h-3 mr-1" /> In Range
        </span>
      )
    }
    if (status === 'below_range') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          <TrendingDown className="w-3 h-3 mr-1" /> Below Range
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
        <TrendingUp className="w-3 h-3 mr-1" /> Above Range
      </span>
    )
  }

  const getRangeText = (min: number | null, max: number | null) => {
    if (min === null && max === null) return '—'
    if (min !== null && max !== null) return `৳${min} - ৳${max}`
    if (min !== null) return `≥ ৳${min}`
    return `≤ ৳${max}`
  }

  if (alerts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
        <div className="mx-auto w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
          <Bell className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No price alerts set</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6 max-w-sm mx-auto">
          Set buy and sell price ranges for your watchlist stocks to get notified when prices hit your targets.
        </p>
        <button
          onClick={openAddModal}
          disabled={watchlistSymbols.length === 0}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Your First Alert
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-6 py-2 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 shrink-0 transition-colors">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {alerts.length} {alerts.length === 1 ? (dict?.priceAlerts?.alertActive || 'Alert Active') : (dict?.priceAlerts?.alertsActive || 'Alerts Active')}
        </h3>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800 relative transition-colors">
          <thead className="bg-gray-100/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm transition-colors backdrop-blur-md">
            <tr>
              <th scope="col" className="px-4 py-2 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.stock || 'Stock'}</th>
              <th scope="col" className="px-4 py-2 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.livePrice || 'Live Price'}</th>
              <th scope="col" className="px-4 py-2 text-center text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.buyRange || 'Buy Range'}</th>
              <th scope="col" className="px-4 py-2 text-center text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.status || 'Buy Status'}</th>
              <th scope="col" className="px-4 py-2 text-center text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.sellRange || 'Sell Range'}</th>
              <th scope="col" className="px-4 py-2 text-center text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.status || 'Sell Status'}</th>
              <th scope="col" className="px-4 py-2 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.actions || 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800 transition-colors">
            {currentAlerts.map((alert) => (
              <tr key={alert.id} className="even:bg-gray-50/60 dark:even:bg-slate-800/40 odd:bg-white dark:odd:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-slate-800/80 transition-colors group">
                <td className="px-4 py-1.5 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-slate-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold shadow-sm border border-indigo-100/50 dark:border-indigo-800 mr-3 text-[11px]">
                      {alert.symbol.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{alert.symbol}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[150px] leading-tight mt-0.5">{alert.company_name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-1.5 whitespace-nowrap text-right">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {formatPrice(alert.current_price)}
                  </span>
                </td>
                <td className="px-4 py-1.5 whitespace-nowrap text-center">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {getRangeText(alert.buy_min_price, alert.buy_max_price)}
                  </span>
                </td>
                <td className="px-4 py-1.5 whitespace-nowrap text-center">
                  {getStatusBadge(alert.buy_status, 'buy')}
                </td>
                <td className="px-4 py-1.5 whitespace-nowrap text-center">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {getRangeText(alert.sell_min_price, alert.sell_max_price)}
                  </span>
                </td>
                <td className="px-4 py-1.5 whitespace-nowrap text-center">
                  {getStatusBadge(alert.sell_status, 'sell')}
                </td>
                <td className="px-4 py-1.5 whitespace-nowrap text-right text-xs font-medium">
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => openEditModal(alert)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                      title="Edit Alert"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteItem({ id: alert.id, symbol: alert.symbol })}
                      disabled={deletingId === alert.id}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Delete Alert"
                    >
                      {deletingId === alert.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {alerts.length > itemsPerPage && (
        <div className="bg-gray-50/50 dark:bg-slate-900/50 px-6 py-4 border-t border-gray-100 dark:border-slate-800 rounded-b-2xl flex items-center justify-between transition-colors shrink-0">
          <div className="hidden sm:block">
            <p className="text-[13px] text-gray-500 dark:text-gray-400">
              Showing page <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
            </p>
          </div>
          <div className="flex-1 flex justify-between sm:justify-end gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
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
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
