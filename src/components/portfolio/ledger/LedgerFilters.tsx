'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown } from 'lucide-react'

type Stock = {
  id: string
  symbol: string
  company_name: string
}

interface LedgerFiltersProps {
  stocks: Stock[]
  initialStockId: string
  initialYear: string
  initialType: string
  handleFilterChange: (key: string, value: string) => void
}

export default function LedgerFilters({
  stocks,
  initialStockId,
  initialYear,
  initialType,
  handleFilterChange
}: LedgerFiltersProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const yearDropdownRef = useRef<HTMLDivElement>(null)
  const typeDropdownRef = useRef<HTMLDivElement>(null)
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false)
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [yearSearchQuery, setYearSearchQuery] = useState('')

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

  return (
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
  )
}
