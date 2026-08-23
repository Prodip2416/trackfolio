'use client'

import { useState } from 'react'
import { Trash2, Loader2, Star, ChevronLeft, ChevronRight, Plus } from 'lucide-react'

type WatchlistItem = {
  id: string
  symbol: string
  company_name: string
  sector: string
  category: string
  current_price: number | null
  price_updated_at: string | null
  created_at: string
}

interface WatchlistTableProps {
  watchlist: WatchlistItem[]
  onRemoveClick: (id: string, symbol: string) => void
  removingId: string | null
  onAddFirstStock: () => void
}

export default function WatchlistTable({ 
  watchlist, 
  onRemoveClick, 
  removingId,
  onAddFirstStock
}: WatchlistTableProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(watchlist.length / itemsPerPage))
  
  // Ensure currentPage is valid if watchlist length changes
  if (currentPage > totalPages) {
    setCurrentPage(totalPages)
  }

  const currentWatchlist = watchlist.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const formatPrice = (price: number | null) => {
    if (price === null) return '—'
    return `৳${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'A': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'B': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'Z': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  if (watchlist.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
        <div className="mx-auto w-16 h-16 bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 rounded-full flex items-center justify-center mb-4">
          <Star className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your watchlist is empty</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6 max-w-sm mx-auto">
          Add stocks you're interested in to track their live prices and set buy/sell alerts.
        </p>
        <button
          onClick={onAddFirstStock}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Your First Stock
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-6 py-3 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 shrink-0 transition-colors">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {watchlist.length} {watchlist.length === 1 ? 'Stock' : 'Stocks'} Tracked
        </h3>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800 relative transition-colors">
          <thead className="bg-gray-100/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm transition-colors backdrop-blur-md">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Stock</th>
              <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Sector</th>
              <th scope="col" className="px-4 py-2.5 text-center text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Cat</th>
              <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Live Price</th>
              <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Added</th>
              <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800 transition-colors">
            {currentWatchlist.map((item) => (
              <tr key={item.id} className="even:bg-gray-50/60 dark:even:bg-slate-800/40 odd:bg-white dark:odd:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-slate-800/80 transition-colors group">
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-slate-800 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold shadow-sm border border-amber-100/50 dark:border-amber-800 mr-3 text-xs">
                      {item.symbol.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white">{item.symbol}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[180px]">{item.company_name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                  {item.sector}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {formatPrice(item.current_price)}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-xs text-gray-500 dark:text-gray-400">
                  {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-xs font-medium">
                  <button
                    onClick={() => onRemoveClick(item.id, item.symbol)}
                    disabled={removingId === item.id}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50 cursor-pointer"
                    title="Remove from Watchlist"
                  >
                    {removingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {watchlist.length > itemsPerPage && (
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium text-gray-900 dark:text-white">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, watchlist.length)}</span> of <span className="font-medium text-gray-900 dark:text-white">{watchlist.length}</span> entries
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
