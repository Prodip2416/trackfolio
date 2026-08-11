'use client'

import { useState, useMemo, useEffect } from 'react'

import { Filter, ArrowDownRight, ArrowUpRight, Calendar, Banknote, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import SearchableDropdown from '@/components/shared/SearchableDropdown'
import { getHistoryData } from './actions'

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

export default function HistoryClient({ 
  uniqueStocks, 
  uniqueYears 
}: { 
  uniqueStocks: string[], 
  uniqueYears: string[] 
}) {
  const [activeTab, setActiveTab] = useState<'BUY' | 'SELL' | 'DIVIDEND'>('BUY')
  const [filterStock, setFilterStock] = useState('ALL')
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString())
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Server Data State
  const [data, setData] = useState<any[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [currentTotal, setCurrentTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Reset page and data when filters change to prevent mismatched data crashes
  useEffect(() => {
    setCurrentPage(1)
    setData([]) // Clear data so old tab's data doesn't render in new tab's columns
  }, [activeTab, filterStock, filterYear])

  // Fetch data from backend whenever filters or page change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const result = await getHistoryData({
          activeTab,
          filterStock,
          filterYear,
          currentPage,
          itemsPerPage
        })
        
        setData(result.data)
        setTotalPages(result.totalPages)
        setTotalRecords(result.totalRecords)
        setCurrentTotal(result.currentTotal)
      } catch (error) {
        console.error("Failed to fetch history data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [activeTab, filterStock, filterYear, currentPage])


  const yearOptions = useMemo(() => {
    const options = [{ label: 'All Years', value: 'ALL' }]
    const yearsSet = new Set(uniqueYears)
    yearsSet.add(new Date().getFullYear().toString())
    
    Array.from(yearsSet).sort().reverse().forEach(year => {
      options.push({ label: year, value: year })
    })
    return options
  }, [uniqueYears])

  // Format stock options
  const stockOptions = useMemo(() => {
    const options = [{ label: 'All Stocks', value: 'ALL' }]
    uniqueStocks.forEach(sym => {
      options.push({ label: sym, value: sym })
    })
    return options
  }, [uniqueStocks])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="w-full">
      <div className="px-4 sm:px-0">
        
        {/* Top Row: Tabs & Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
          {/* Tabs Section */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setActiveTab('BUY'); setData([]); }}
              className={`flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === 'BUY'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Buy History</span>
            </button>

            <button
              onClick={() => { setActiveTab('SELL'); setData([]); }}
              className={`flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === 'SELL'
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Sell History</span>
            </button>

            <button
              onClick={() => { setActiveTab('DIVIDEND'); setData([]); }}
              className={`flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === 'DIVIDEND'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Dividend History</span>
            </button>
          </div>

          {/* Filter Summary */}
          <div className={`px-5 py-2.5 rounded-xl border flex flex-row items-center gap-4 shadow-sm transition-colors ${
            activeTab === 'BUY' ? 'bg-indigo-50/80 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/30' : 
            activeTab === 'SELL' ? 'bg-pink-50/80 dark:bg-pink-900/20 border-pink-100 dark:border-pink-800/30' :
            'bg-green-50/80 dark:bg-green-900/20 border-green-100 dark:border-green-800/30'
          }`}>
            <div className="flex flex-col">
              <span className={`text-[10px] font-bold tracking-wider uppercase transition-colors ${
                activeTab === 'BUY' ? 'text-indigo-600 dark:text-indigo-400' : 
                activeTab === 'SELL' ? 'text-pink-600 dark:text-pink-400' :
                'text-green-600 dark:text-green-400'
              }`}>
                Filtered {activeTab === 'BUY' ? 'Buy' : activeTab === 'SELL' ? 'Sell' : 'Cash'} Total
              </span>
              <span className={`text-lg font-extrabold leading-tight transition-colors ${
                activeTab === 'BUY' ? 'text-indigo-900 dark:text-indigo-300' : 
                activeTab === 'SELL' ? 'text-pink-900 dark:text-pink-300' :
                'text-green-900 dark:text-green-300'
              }`}>
                ৳{currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Results Container (Filters + Table) */}
        <div className="bg-white dark:bg-slate-900 shadow-sm border border-gray-200 dark:border-slate-800 rounded-2xl relative transition-colors">
          
          {/* Filters Section Right Above Table */}
          <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 rounded-t-2xl flex flex-row flex-wrap justify-between items-center gap-3 relative z-10 transition-colors">
            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden sm:flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
              
              <div className="w-[150px] sm:w-[170px]">
                <SearchableDropdown
                  options={stockOptions}
                  value={filterStock}
                  onChange={setFilterStock}
                  placeholder="All Stocks"
                  searchPlaceholder="Search stock..."
                  buttonClassName="px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-xs font-medium min-h-[34px]"
                />
              </div>

              <div className="w-[120px] sm:w-[130px]">
                <SearchableDropdown
                  options={yearOptions}
                  value={filterYear}
                  onChange={setFilterYear}
                  placeholder="All Years"
                  searchPlaceholder="Search year..."
                  buttonClassName="px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-xs font-medium min-h-[34px]"
                />
              </div>

              {(filterStock !== 'ALL' || filterYear !== 'ALL') && (
                <button 
                  onClick={() => {
                    setFilterStock('ALL')
                    setFilterYear('ALL')
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm transition-colors">
              Records: <span className="text-gray-900 dark:text-white">{totalRecords}</span>
            </div>
          </div>
          
          <div className="relative">
            {/* Loading Blur Overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] rounded-b-2xl transition-all duration-300">
                <div className="flex flex-col items-center bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-slate-700">
                  <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mb-2" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Loading records...</span>
                </div>
              </div>
            )}

            <div className="overflow-x-auto min-h-[300px]">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800 transition-colors">
                <thead className="bg-gray-100/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 transition-colors">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Symbol</th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Date</th>
                    {activeTab === 'DIVIDEND' ? (
                      <>
                        <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Cash (৳)</th>
                        <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Bonus Shares</th>
                      </>
                    ) : (
                      <>
                        <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Quantity</th>
                        <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Price (৳)</th>
                        <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider hidden sm:table-cell">Fee (৳)</th>
                        <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Total (৳)</th>
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
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
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
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          {isLoading ? '' : `No ${activeTab.toLowerCase()} transactions match your current filters.`}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="bg-gray-50/50 dark:bg-slate-900/50 px-6 py-4 border-t border-gray-100 dark:border-slate-800 rounded-b-2xl flex items-center justify-between transition-colors">
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
        </div>

      </div>
    </div>
  )
}
