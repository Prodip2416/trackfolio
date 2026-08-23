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
}

export default function PriceAlertsTable({
  alerts,
  watchlistSymbols,
  openAddModal,
  openEditModal,
  setDeleteItem,
  deletingId
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
      <div className="px-6 py-3 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 shrink-0 transition-colors">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {alerts.length} {alerts.length === 1 ? 'Alert' : 'Alerts'} Active
        </h3>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800 relative transition-colors">
          <thead className="bg-gray-100/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm transition-colors backdrop-blur-md">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Stock</th>
              <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Live Price</th>
              <th scope="col" className="px-4 py-2.5 text-center text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Buy Range</th>
              <th scope="col" className="px-4 py-2.5 text-center text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Buy Status</th>
              <th scope="col" className="px-4 py-2.5 text-center text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Sell Range</th>
              <th scope="col" className="px-4 py-2.5 text-center text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Sell Status</th>
              <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800 transition-colors">
            {currentAlerts.map((alert) => (
              <tr key={alert.id} className="even:bg-gray-50/60 dark:even:bg-slate-800/40 odd:bg-white dark:odd:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-slate-800/80 transition-colors group">
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-slate-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold shadow-sm border border-indigo-100/50 dark:border-indigo-800 mr-3 text-xs">
                      {alert.symbol.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white">{alert.symbol}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{alert.company_name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {formatPrice(alert.current_price)}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {getRangeText(alert.buy_min_price, alert.buy_max_price)}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center">
                  {getStatusBadge(alert.buy_status, 'buy')}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {getRangeText(alert.sell_min_price, alert.sell_max_price)}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center">
                  {getStatusBadge(alert.sell_status, 'sell')}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-xs font-medium">
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => openEditModal(alert)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                      title="Edit Alert"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteItem({ id: alert.id, symbol: alert.symbol })}
                      disabled={deletingId === alert.id}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Delete Alert"
                    >
                      {deletingId === alert.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
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
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium text-gray-900 dark:text-white">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, alerts.length)}</span> of <span className="font-medium text-gray-900 dark:text-white">{alerts.length}</span> entries
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {currentPage} / {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
