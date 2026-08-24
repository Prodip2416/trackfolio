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
  dict?: any
}

export default function WatchlistTable({ 
  watchlist, 
  onRemoveClick, 
  removingId,
  onAddFirstStock,
  dict
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
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{dict?.watchlist?.emptyTitle || 'Your watchlist is empty'}</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6 max-w-sm mx-auto">
          {dict?.watchlist?.emptyDesc || 'Add stocks you\'re interested in to track their live prices and set buy/sell alerts.'}
        </p>
        <button
          onClick={onAddFirstStock}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5 mr-2" />
          {dict?.watchlist?.addFirstStock || 'Add Your First Stock'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-6 py-2 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 shrink-0 transition-colors">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {watchlist.length} {watchlist.length === 1 ? (dict?.watchlist?.stockTracked || 'Stock Tracked') : (dict?.watchlist?.stocksTracked || 'Stocks Tracked')}
        </h3>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800 relative transition-colors">
          <thead className="bg-gray-100/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm transition-colors backdrop-blur-md">
            <tr>
              <th scope="col" className="px-4 py-2 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.stock || 'Stock'}</th>
              <th scope="col" className="px-4 py-2 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.sector || 'Sector'}</th>
              <th scope="col" className="px-4 py-2 text-center text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.category || 'Cat'}</th>
              <th scope="col" className="px-4 py-2 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.livePrice || 'Live Price'}</th>
              <th scope="col" className="px-4 py-2 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.added || 'Added'}</th>
              <th scope="col" className="px-4 py-2 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.actions || 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800 transition-colors">
            {currentWatchlist.map((item) => (
              <tr key={item.id} className="even:bg-gray-50/60 dark:even:bg-slate-800/40 odd:bg-white dark:odd:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-slate-800/80 transition-colors group">
                <td className="px-4 py-1.5 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-slate-800 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold shadow-sm border border-amber-100/50 dark:border-amber-800 mr-3 text-[11px]">
                      {item.symbol.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{item.symbol}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[180px] leading-tight mt-0.5">{item.company_name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-1.5 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                  {item.sector}
                </td>
                <td className="px-4 py-1.5 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                </td>
                <td className="px-4 py-1.5 whitespace-nowrap text-right">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {formatPrice(item.current_price)}
                  </span>
                </td>
                <td className="px-4 py-1.5 whitespace-nowrap text-right text-[11px] text-gray-500 dark:text-gray-400">
                  {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-1.5 whitespace-nowrap text-right text-xs font-medium">
                  <button
                    onClick={() => onRemoveClick(item.id, item.symbol)}
                    disabled={removingId === item.id}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50 cursor-pointer"
                    title="Remove from Watchlist"
                  >
                    {removingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
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
