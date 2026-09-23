'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown } from 'lucide-react'

interface ShortTermFiltersProps {
  symbols: string[]
  initialSymbol: string
  initialYear: string
  handleFilterChange: (key: string, value: string) => void
}

export default function ShortTermFilters({
  symbols,
  initialSymbol,
  initialYear,
  handleFilterChange
}: ShortTermFiltersProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const yearDropdownRef = useRef<HTMLDivElement>(null)

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false)

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
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredSymbols = symbols.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))

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
            {initialSymbol === 'ALL' ? 'All Stocks' : initialSymbol}
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
                  handleFilterChange('symbol', 'ALL')
                  setIsDropdownOpen(false)
                  setSearchQuery('')
                }}
                className={`px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${initialSymbol === 'ALL' ? 'bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}
              >
                <div className="font-semibold text-sm">All Stocks</div>
              </div>
              {filteredSymbols.map((symbol) => (
                <div
                  key={symbol}
                  onClick={() => {
                    handleFilterChange('symbol', symbol)
                    setIsDropdownOpen(false)
                    setSearchQuery('')
                  }}
                  className={`px-3 py-2 flex flex-col hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border-t border-gray-100 dark:border-slate-700/50 ${initialSymbol === symbol ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
                >
                  <span className={`font-semibold text-sm ${initialSymbol === symbol ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                    {symbol}
                  </span>
                </div>
              ))}
              {filteredSymbols.length === 0 && (
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
    </div>
  )
}
