'use client'

import { useState, useMemo } from 'react'
import { Filter, Calendar } from 'lucide-react'

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

export default function HistoryClient({ transactions }: { transactions: Transaction[] }) {
  const [filterStock, setFilterStock] = useState('ALL')
  const [filterType, setFilterType] = useState('ALL')
  const [filterYear, setFilterYear] = useState('ALL')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  // Get unique stocks the user has traded
  const uniqueStocks = useMemo(() => {
    const symbols = new Set<string>()
    transactions.forEach(t => symbols.add(t.stocks.symbol))
    return Array.from(symbols).sort()
  }, [transactions])

  // Get unique years the user has traded
  const uniqueYears = useMemo(() => {
    const years = new Set<string>()
    transactions.forEach(t => years.add(t.transaction_date.substring(0, 4)))
    return Array.from(years).sort().reverse() // Newest first
  }, [transactions])

  // Apply filters
  const filteredData = useMemo(() => {
    return transactions.filter(txn => {
      // Stock Filter
      if (filterStock !== 'ALL' && txn.stocks.symbol !== filterStock) return false
      
      // Type Filter
      if (filterType !== 'ALL' && txn.type !== filterType) return false
      
      // Year Filter
      if (filterYear !== 'ALL' && !txn.transaction_date.startsWith(filterYear)) return false
      
      // Date Range Filter
      if (filterStartDate && txn.transaction_date < filterStartDate) return false
      if (filterEndDate && txn.transaction_date > filterEndDate) return false

      return true
    })
  }, [transactions, filterStock, filterType, filterYear, filterStartDate, filterEndDate])

  // Calculate totals for the filtered view
  const totals = useMemo(() => {
    let buyAmount = 0
    let sellAmount = 0
    filteredData.forEach(txn => {
      const value = (txn.quantity * txn.price_per_unit)
      if (txn.type === 'BUY') {
        buyAmount += value + (txn.brokerage_fee || 0)
      } else {
        sellAmount += value - (txn.brokerage_fee || 0)
      }
    })
    return { buyAmount, sellAmount }
  }, [filteredData])

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-2 sm:px-0">
        
        {/* Filters Section (Minimal) */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-3 w-full">
            
            {/* Filter Icon Indicator */}
            <div className="hidden sm:flex items-center justify-center w-9 h-9 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-400">
              <Filter className="w-4 h-4" />
            </div>

            {/* Stock Filter */}
            <select 
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[120px]"
            >
              <option value="ALL">All Stocks</option>
              {uniqueStocks.map(sym => (
                <option key={sym} value={sym}>{sym}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[100px]"
            >
              <option value="ALL">All Types</option>
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>

            {/* Year Filter */}
            <select 
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[100px]"
            >
              <option value="ALL">All Years</option>
              {uniqueYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {/* Date Range Start */}
            <div className="relative flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
              <span className="pl-3 text-xs font-medium text-gray-400">From</span>
              <input 
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                className="px-2 py-2 bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
              />
            </div>

            {/* Date Range End */}
            <div className="relative flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
              <span className="pl-3 text-xs font-medium text-gray-400">To</span>
              <input 
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                className="px-2 py-2 bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
              />
            </div>

            {/* Clear Button */}
            {(filterStock !== 'ALL' || filterType !== 'ALL' || filterYear !== 'ALL' || filterStartDate || filterEndDate) && (
              <button 
                onClick={() => {
                  setFilterStock('ALL')
                  setFilterType('ALL')
                  setFilterYear('ALL')
                  setFilterStartDate('')
                  setFilterEndDate('')
                }}
                className="px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto md:ml-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-600 uppercase">Filtered Buy Total</p>
            <p className="text-xl font-bold text-indigo-900 mt-1">৳{totals.buyAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
            <p className="text-xs font-semibold text-pink-600 uppercase">Filtered Sell Total</p>
            <p className="text-xl font-bold text-pink-900 mt-1">৳{totals.sellAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-700">Transactions Found: {filteredData.length}</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Price (৳)</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Fee (৳)</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total (৳)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length > 0 ? (
                  filteredData.map((txn) => {
                    const total = (txn.quantity * txn.price_per_unit) + (txn.type === 'BUY' ? txn.brokerage_fee : -txn.brokerage_fee)
                    return (
                      <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{txn.stocks?.symbol}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(txn.transaction_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            txn.type === 'BUY' ? 'bg-indigo-100 text-indigo-800' : 'bg-pink-100 text-pink-800'
                          }`}>
                            {txn.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {txn.quantity.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {txn.price_per_unit.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right hidden sm:table-cell">
                          {txn.brokerage_fee?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                          {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No transactions match your current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
