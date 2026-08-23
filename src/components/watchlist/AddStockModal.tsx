'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Loader2, Star, TrendingUp, X } from 'lucide-react'
import { getDSECompaniesForWatchlist, addToWatchlist } from '@/app/watchlist/actions'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

type DSECompany = {
  symbol: string
  company_name: string
  sector: string | null
  category: string | null
  current_price: number | null
}

type WatchlistItem = {
  symbol: string
}

interface AddStockModalProps {
  isOpen: boolean
  onClose: () => void
  watchlist: WatchlistItem[]
}

export default function AddStockModal({ isOpen, onClose, watchlist }: AddStockModalProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DSECompany[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (!isOpen) return

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
  }, [query, isOpen])

  // Handle outside click to close results
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
      onClose()
      setQuery('')
      setResults([])
      router.refresh()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-10 pb-10 sm:pt-20">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md relative flex flex-col max-h-[85vh] sm:max-h-[80vh] border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10 cursor-pointer p-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="px-6 pt-6 pb-5 flex-shrink-0 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            Add to Watchlist
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Search and track your favorite DSE stocks.</p>
        </div>

        <div className="p-4 flex-shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="relative" ref={dropdownRef}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by symbol or company name..."
              autoFocus
              className="w-full pl-11 pr-10 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white dark:placeholder-gray-400 placeholder-gray-400 font-medium text-sm shadow-sm"
            />
            {isSearching && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />
            )}
            {query && !isSearching && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full flex items-center justify-center cursor-pointer bg-gray-100 dark:bg-gray-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar px-2 pb-2">
          {results.length > 0 ? (
            <div className="px-4 pb-4 pt-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
                Search Results ({results.length})
              </div>
              <div className="space-y-2">
                {results.map((company) => {
                  const isAlreadyAdded = watchlist.some(w => w.symbol === company.symbol)
                  return (
                    <div
                      key={company.symbol}
                      onClick={() => !isAlreadyAdded && !isAdding && handleAdd(company.symbol)}
                      className={`p-3 rounded-xl border transition-all duration-200 flex items-center justify-between group ${
                        isAlreadyAdded 
                          ? 'bg-gray-50 dark:bg-gray-800/30 border-transparent opacity-60 cursor-not-allowed' 
                          : 'bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50 hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 hover:shadow-sm cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm border ${
                          isAlreadyAdded 
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                            : 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 text-indigo-600 dark:text-indigo-400 border-gray-200 dark:border-gray-700 group-hover:border-indigo-200 dark:group-hover:border-indigo-500/50'
                        }`}>
                          {company.symbol.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                            {company.symbol}
                            {company.sector && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md font-medium border border-gray-200 dark:border-gray-700">
                                {company.sector}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[170px] mt-0.5 font-medium">
                            {company.company_name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {company.current_price ? `৳${Number(company.current_price).toFixed(2)}` : '—'}
                        </div>
                        {isAlreadyAdded ? (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full mt-1 border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-emerald-600 dark:fill-emerald-400" />
                            Added
                          </span>
                        ) : (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full mt-1 border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-3 h-3" />
                            Add
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : query.trim() && !isSearching ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-900 dark:text-white font-medium text-base">No stocks found</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-[250px]">
                We couldn't find any DSE stocks matching "{query}"
              </p>
            </div>
          ) : !query.trim() ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-800/30">
                <TrendingUp className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
              </div>
              <p className="text-gray-900 dark:text-white font-medium text-base">Search for stocks</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-[250px]">
                Type a company symbol or name to add it to your watchlist
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
