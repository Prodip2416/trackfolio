'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Search, Loader2, Star, TrendingUp, TrendingDown, Minus, X } from 'lucide-react'
import { getDSECompaniesForWatchlist, addToWatchlist, removeFromWatchlist } from './actions'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

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

type DSECompany = {
  symbol: string
  company_name: string
  sector: string | null
  category: string | null
  current_price: number | null
}

export default function WatchlistClient({ 
  initialWatchlist, 
  dict 
}: { 
  initialWatchlist: WatchlistItem[]
  dict?: any 
}) {
  const router = useRouter()
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialWatchlist)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DSECompany[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (!isAddModalOpen) return

    const fetchCompanies = async () => {
      if (!query.trim()) {
        setResults([])
        return
      }
      setIsSearching(true)
      const data = await getDSECompaniesForWatchlist(query)
      setResults(data || [])
      setIsSearching(false)
    }

    const timer = setTimeout(() => {
      fetchCompanies()
    }, 300)

    return () => clearTimeout(timer)
  }, [query, isAddModalOpen])

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setResults([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAdd = async (symbol: string) => {
    setIsAdding(true)
    const result = await addToWatchlist(symbol)
    setIsAdding(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(`${symbol} added to watchlist!`)
      setIsAddModalOpen(false)
      setQuery('')
      setResults([])
      router.refresh()
    }
  }

  const handleRemove = async (id: string, symbol: string) => {
    setRemovingId(id)
    const result = await removeFromWatchlist(id)
    setRemovingId(null)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(`${symbol} removed from watchlist`)
      router.refresh()
    }
  }

  const getPriceChange = (item: WatchlistItem) => {
    // We don't have previous price, so show neutral
    return null
  }

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

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-120px)] space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Star className="w-5 h-5 mr-2 text-amber-500 fill-amber-500" />
            My Watchlist
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Track your favorite DSE stocks and get notified when prices hit your target.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Stock
        </button>
      </div>

      {/* Watchlist Table */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0 transition-colors">
        {watchlist.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
            <div className="mx-auto w-16 h-16 bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 rounded-full flex items-center justify-center mb-4">
              <Star className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your watchlist is empty</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6 max-w-sm mx-auto">
              Add stocks you're interested in to track their live prices and set buy/sell alerts.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Stock
            </button>
          </div>
        ) : (
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
                  {watchlist.map((item) => (
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
                          onClick={() => handleRemove(item.id, item.symbol)}
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
          </div>
        )}
      </div>

      {/* Add Stock Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto pt-20 pb-10">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md relative flex flex-col max-h-full">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="px-6 pt-6 pb-2 flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Add to Watchlist</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Search for a DSE stock to track.</p>
            </div>

            <div className="px-6 pb-6 overflow-y-auto custom-scrollbar flex-grow">
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by symbol or company name..."
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder-gray-400 placeholder-gray-400"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                  )}
                </div>

                {/* Search Results */}
                {results.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white/90 dark:bg-gray-800/90 border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
                    {results.map((company) => {
                      const isAlreadyAdded = watchlist.some(w => w.symbol === company.symbol)
                      return (
                        <div
                          key={company.symbol}
                          onClick={() => !isAlreadyAdded && !isAdding && handleAdd(company.symbol)}
                          className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0 transition-colors ${
                            isAlreadyAdded 
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                {company.symbol}
                                <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">
                                  {company.sector || 'N/A'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-300 truncate mt-0.5">
                                {company.company_name}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {company.current_price ? `৳${Number(company.current_price).toFixed(2)}` : '—'}
                              </div>
                              {isAlreadyAdded ? (
                                <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold">✓ Added</span>
                              ) : (
                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">+ Add</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {query.trim() && !isSearching && results.length === 0 && (
                  <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                    No stocks found matching "{query}"
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}