'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ArrowUpRight, ArrowDownRight, Coins, Search, Loader2, ChevronDown, X, Briefcase, Banknote, Gift, TrendingDown } from 'lucide-react'

type LedgerRow = {
  id: string
  date: string
  type: string
  symbol: string
  company_name: string
  quantity: number
  price_per_unit: number | null
  total: number
}

type Stock = {
  id: string
  symbol: string
  company_name: string
}

export default function LedgerClient({ 
  stocks, 
  initialData, 
  initialStockId, 
  initialYear,
  initialType,
  dict 
}: { 
  stocks: Stock[]
  initialData: LedgerRow[]
  initialStockId: string
  initialYear: string
  initialType: string
  dict: any
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(false)
  }, [searchParams])

  const dropdownRef = useRef<HTMLDivElement>(null)
  const yearDropdownRef = useRef<HTMLDivElement>(null)
  const typeDropdownRef = useRef<HTMLDivElement>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false)
  const [yearSearchQuery, setYearSearchQuery] = useState('')
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setIsYearDropdownOpen(false)
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setIsTypeDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredStocks = stocks.filter(s => 
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedStock = initialStockId === 'ALL' ? null : stocks.find(s => s.id === initialStockId)

  const years = Array.from({ length: 51 }, (_, i) => (2025 + i).toString()) // 2025 to 2075
  
  const filteredYears = years.filter(y => y.includes(yearSearchQuery))

  let totalShareCount = 0
  let totalCashDividend = 0
  let totalBuyPrice = 0
  let totalBonusShare = 0
  let totalSellPrice = 0

  initialData.forEach(row => {
    if (row.type === 'BUY') {
      totalShareCount += row.quantity
      totalBuyPrice += row.total
    } else if (row.type === 'SELL') {
      totalShareCount -= row.quantity
      totalSellPrice += row.total
    } else if (row.type === 'DIVIDEND') {
      totalBonusShare += row.quantity
      totalShareCount += row.quantity
      totalCashDividend += row.total
    }
  })

  const handleFilterChange = (key: string, value: string) => {
    setIsLoading(true)
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'ALL' && key !== 'year') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BUY':
        return <ArrowDownRight className="w-4 h-4 text-emerald-500" />
      case 'SELL':
        return <ArrowUpRight className="w-4 h-4 text-rose-500" />
      case 'DIVIDEND':
        return <Coins className="w-4 h-4 text-indigo-500" />
      default:
        return null
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'BUY':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            {dict.dashboard?.buy || 'BUY'}
          </span>
        )
      case 'SELL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
            {dict.dashboard?.sell || 'SELL'}
          </span>
        )
      case 'DIVIDEND':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
            {dict.sidebar?.dividendReport ? 'DIVIDEND' : 'DIVIDEND'}
          </span>
        )
      default:
        return <span>{type}</span>
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-120px)] space-y-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {dict.sidebar?.assetLedger || 'Asset Ledger'}
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <div 
              className="w-48 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm flex items-center justify-between cursor-pointer transition-colors"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="truncate">
                {selectedStock ? selectedStock.symbol : 'All Stocks'}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {isDropdownOpen && (
              <div className="absolute z-50 w-64 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 flex flex-col overflow-hidden left-0 origin-top-left">
                <div className="p-2 border-b border-gray-100 dark:border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search stock..."
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-slate-900 border border-transparent rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto custom-scrollbar flex-1">
                  <div 
                    onClick={() => {
                      handleFilterChange('stockId', 'ALL')
                      setIsDropdownOpen(false)
                      setSearchQuery('')
                    }}
                    className={`px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${!selectedStock ? 'bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <div className="font-semibold text-sm">All Stocks</div>
                  </div>
                  {filteredStocks.map((stock) => (
                    <div
                      key={stock.id}
                      onClick={() => {
                        handleFilterChange('stockId', stock.id)
                        setIsDropdownOpen(false)
                        setSearchQuery('')
                      }}
                      className={`px-3 py-2 flex flex-col hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border-t border-gray-100 dark:border-slate-700/50 ${selectedStock?.id === stock.id ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
                    >
                      <span className={`font-semibold text-sm ${selectedStock?.id === stock.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                        {stock.symbol}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {stock.company_name}
                      </span>
                    </div>
                  ))}
                  {filteredStocks.length === 0 && (
                    <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No stocks found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="relative" ref={yearDropdownRef}>
            <div 
              className="w-32 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm flex items-center justify-between cursor-pointer transition-colors"
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
            >
              <span className="truncate">
                {initialYear === 'ALL' ? 'All Years' : initialYear}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {isYearDropdownOpen && (
              <div className="absolute z-50 w-48 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 flex flex-col overflow-hidden right-0 origin-top-right">
                <div className="p-2 border-b border-gray-100 dark:border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={yearSearchQuery}
                      onChange={(e) => setYearSearchQuery(e.target.value)}
                      placeholder="Search year..."
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-slate-900 border border-transparent rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto custom-scrollbar flex-1">
                  <div 
                    onClick={() => {
                      handleFilterChange('year', 'ALL')
                      setIsYearDropdownOpen(false)
                      setYearSearchQuery('')
                    }}
                    className={`px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${initialYear === 'ALL' ? 'bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <div className="font-semibold text-sm">All Years</div>
                  </div>
                  {filteredYears.map((y) => (
                    <div
                      key={y}
                      onClick={() => {
                        handleFilterChange('year', y)
                        setIsYearDropdownOpen(false)
                        setYearSearchQuery('')
                      }}
                      className={`px-3 py-2 flex flex-col hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border-t border-gray-100 dark:border-slate-700/50 ${initialYear === y ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
                    >
                      <span className={`font-semibold text-sm ${initialYear === y ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                        {y}
                      </span>
                    </div>
                  ))}
                  {filteredYears.length === 0 && (
                    <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No years found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="relative" ref={typeDropdownRef}>
            <div 
              className="w-36 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm flex items-center justify-between cursor-pointer transition-colors"
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
            >
              <span className="truncate">
                {initialType === 'ALL' ? 'All Types' : initialType === 'BUY' ? 'Buy' : initialType === 'SELL' ? 'Sell' : 'Dividend'}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {isTypeDropdownOpen && (
              <div className="absolute z-50 w-36 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg flex flex-col overflow-hidden right-0 origin-top-right">
                <div className="overflow-y-auto custom-scrollbar flex-1 py-1">
                  {[
                    { label: 'All Types', value: 'ALL' },
                    { label: 'Buy', value: 'BUY' },
                    { label: 'Sell', value: 'SELL' },
                    { label: 'Dividend', value: 'DIVIDEND' }
                  ].map((t) => (
                    <div
                      key={t.value}
                      onClick={() => {
                        handleFilterChange('type', t.value)
                        setIsTypeDropdownOpen(false)
                      }}
                      className={`px-3 py-2 flex flex-col hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${initialType === t.value ? 'bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      <span className="text-sm">
                        {t.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Share */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-2 -top-2 w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/20 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">{dict.ledger?.totalShare || 'Total Share'}</h3>
              <div className="p-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-md text-indigo-600 dark:text-indigo-400">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {totalShareCount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Total Buy Price */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-2 -top-2 w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">{dict.ledger?.totalBuyPrice || 'Total Buy Price'}</h3>
              <div className="p-1 bg-blue-50 dark:bg-blue-900/30 rounded-md text-blue-600 dark:text-blue-400">
                <Banknote className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              ৳ {totalBuyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Total Sell Price */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-2 -top-2 w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/20 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">{dict.ledger?.totalSellPrice || 'Total Sell Price'}</h3>
              <div className="p-1 bg-rose-50 dark:bg-rose-900/30 rounded-md text-rose-600 dark:text-rose-400">
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              ৳ {totalSellPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        
        {/* Total Cash Dividend */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-2 -top-2 w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">{dict.ledger?.totalCashDividend || 'Total Cash Dividend'}</h3>
              <div className="p-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-md text-emerald-600 dark:text-emerald-400">
                <Coins className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              ৳ {totalCashDividend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Total Bonus Stock */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-2 -top-2 w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">{dict.ledger?.totalBonusStock || 'Total Bonus Stock'}</h3>
              <div className="p-1 bg-amber-50 dark:bg-amber-900/30 rounded-md text-amber-600 dark:text-amber-400">
                <Gift className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {totalBonusShare.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-colors duration-200 relative flex flex-col min-h-0">
        {(isPending || isLoading) && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-30 flex items-center justify-center min-h-[200px]">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        )}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <table className="w-full text-xs text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-200/50 dark:border-slate-800 sticky top-0 z-20 backdrop-blur-md">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Date</th>
                <th className="px-4 py-2.5 font-semibold">Type</th>
                <th className="px-4 py-2.5 font-semibold">Stock</th>
                <th className="px-4 py-2.5 font-semibold text-right">Quantity</th>
                <th className="px-4 py-2.5 font-semibold text-right">Price / Unit</th>
                <th className="px-4 py-2.5 font-semibold text-right">Total (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-slate-800/50">
              {initialData.map((row) => (
                <tr key={`${row.type}-${row.id}`} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(row.date))}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(row.type)}
                      {getTypeBadge(row.type)}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {row.symbol}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-gray-900 dark:text-white">
                    {row.quantity > 0 ? row.quantity.toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-gray-600 dark:text-gray-300">
                    {row.price_per_unit ? `৳ ${row.price_per_unit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right font-medium text-gray-900 dark:text-white">
                    {row.total > 0 ? `৳ ${row.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                  </td>
                </tr>
              ))}
              
              {initialData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      <p className="text-base font-medium text-gray-900 dark:text-gray-200">No transactions found</p>
                      <p className="text-sm">Try adjusting your filters or adding new transactions.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
