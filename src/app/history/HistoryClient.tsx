'use client'

import { useState, useMemo, useEffect } from 'react'

import { Filter, ArrowDownRight, ArrowUpRight, Calendar, Banknote, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import SearchableDropdown from '@/components/shared/SearchableDropdown'
import PremiumDatePicker from '@/components/shared/PremiumDatePicker'
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
  const [filterYear, setFilterYear] = useState('ALL')
  
  // Initialize dates: 1 month ago to today
  const [filterStartDate, setFilterStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().substring(0, 10)
  })
  
  const [filterEndDate, setFilterEndDate] = useState(() => {
    return new Date().toISOString().substring(0, 10)
  })
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Server Data State
  const [data, setData] = useState<any[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [currentTotal, setCurrentTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, filterStock, filterYear, filterStartDate, filterEndDate])

  // Fetch data from backend whenever filters or page change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const result = await getHistoryData({
          activeTab,
          filterStock,
          filterYear,
          filterStartDate,
          filterEndDate,
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
  }, [activeTab, filterStock, filterYear, filterStartDate, filterEndDate, currentPage])


  // Generate year options from fetched unique years
  const yearOptions = useMemo(() => {
    const options = [{ label: 'All Years', value: 'ALL' }]
    uniqueYears.forEach(year => {
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
              onClick={() => setActiveTab('BUY')}
              className={`flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === 'BUY'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-indigo-50 border border-gray-200'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Buy History</span>
            </button>

            <button
              onClick={() => setActiveTab('SELL')}
              className={`flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === 'SELL'
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-pink-50 border border-gray-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Sell History</span>
            </button>

            <button
              onClick={() => setActiveTab('DIVIDEND')}
              className={`flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === 'DIVIDEND'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-green-50 border border-gray-200'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Dividend History</span>
            </button>
          </div>

          {/* Filter Summary */}
          <div className={`px-5 py-2.5 rounded-xl border flex flex-row items-center gap-4 shadow-sm ${
            activeTab === 'BUY' ? 'bg-indigo-50/80 border-indigo-100' : 
            activeTab === 'SELL' ? 'bg-pink-50/80 border-pink-100' :
            'bg-green-50/80 border-green-100'
          }`}>
            <div className="flex flex-col">
              <span className={`text-[10px] font-bold tracking-wider uppercase ${
                activeTab === 'BUY' ? 'text-indigo-600' : 
                activeTab === 'SELL' ? 'text-pink-600' :
                'text-green-600'
              }`}>
                Filtered {activeTab === 'BUY' ? 'Buy' : activeTab === 'SELL' ? 'Sell' : 'Cash'} Total
              </span>
              <span className={`text-lg font-extrabold leading-tight ${
                activeTab === 'BUY' ? 'text-indigo-900' : 
                activeTab === 'SELL' ? 'text-pink-900' :
                'text-green-900'
              }`}>
                ৳{currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Results Container (Filters + Table) */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-2xl relative">
          
          {/* Filters Section Right Above Table */}
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex flex-row flex-wrap justify-between items-center gap-3 relative z-10">
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

              <div className="w-[145px] sm:w-[160px]">
                <PremiumDatePicker
                  value={filterStartDate}
                  onChange={setFilterStartDate}
                  placeholder="From date"
                  buttonClassName="px-3 py-1.5 bg-white border rounded-lg shadow-sm text-xs font-medium min-h-[34px]"
                />
              </div>

              <div className="w-[145px] sm:w-[160px]">
                <PremiumDatePicker
                  value={filterEndDate}
                  onChange={setFilterEndDate}
                  placeholder="To date"
                  buttonClassName="px-3 py-1.5 bg-white border rounded-lg shadow-sm text-xs font-medium min-h-[34px]"
                />
              </div>

              {(filterStock !== 'ALL' || filterYear !== 'ALL' || filterStartDate || filterEndDate) && (
                <button 
                  onClick={() => {
                    setFilterStock('ALL')
                    setFilterYear('ALL')
                    setFilterStartDate('')
                    setFilterEndDate('')
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="text-xs font-semibold text-gray-500 whitespace-nowrap bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
              Records: <span className="text-gray-900">{totalRecords}</span>
            </div>
          </div>
          
          <div className="relative">
            {/* Loading Blur Overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-b-2xl transition-all duration-300">
                <div className="flex flex-col items-center bg-white px-6 py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                  <span className="text-sm font-bold text-gray-700">Loading records...</span>
                </div>
              </div>
            )}

            <div className="overflow-x-auto min-h-[300px]">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Symbol</th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    {activeTab === 'DIVIDEND' ? (
                      <>
                        <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Cash (৳)</th>
                        <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Bonus Shares</th>
                      </>
                    ) : (
                      <>
                        <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Price (৳)</th>
                        <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Fee (৳)</th>
                        <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total (৳)</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {activeTab === 'DIVIDEND' ? (
                    // DIVIDEND TABLE ROWS
                    data.length > 0 ? (
                      (data as Dividend[]).map((div) => (
                        <tr key={div.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="text-xs font-bold text-gray-900">{div.stocks?.symbol}</div>
                            <div className="text-[10px] text-gray-500 truncate max-w-[150px] hidden md:block">{div.stocks?.company_name}</div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                            {formatDate(div.date)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                              div.type === 'INTERIM' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {div.type}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-green-600 text-right font-medium">
                            {div.cash_amount ? `৳${div.cash_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs font-bold text-gray-900 text-right">
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
                        const total = (txn.quantity * txn.price_per_unit) + (txn.type === 'BUY' ? txn.brokerage_fee : -txn.brokerage_fee)
                        return (
                          <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="text-xs font-bold text-gray-900">{txn.stocks?.symbol}</div>
                              <div className="text-[10px] text-gray-500 truncate max-w-[150px] hidden md:block">{txn.stocks?.company_name}</div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                              {formatDate(txn.transaction_date)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 text-right font-medium">
                              {txn.quantity.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 text-right">
                              {txn.price_per_unit.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 text-right hidden sm:table-cell">
                              {txn.brokerage_fee?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs font-bold text-gray-900 text-right">
                              {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 rounded-b-2xl flex items-center justify-between">
              <div className="hidden sm:block">
                <p className="text-[13px] text-gray-500">
                  Showing page <span className="font-semibold text-gray-900">{currentPage}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
                </p>
              </div>
              <div className="flex-1 flex justify-between sm:justify-end gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                  className="relative inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="hidden sm:flex items-center gap-1 mx-2 overflow-x-auto max-w-[200px]">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      disabled={isLoading}
                      className={`relative inline-flex items-center justify-center min-w-[32px] h-8 px-1 rounded-lg text-[13px] font-medium transition-colors ${
                        page === currentPage
                          ? 'bg-indigo-600 text-white shadow-sm border border-indigo-600'
                          : 'bg-white text-gray-600 border border-transparent hover:bg-gray-100 disabled:opacity-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || isLoading}
                  className="relative inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
