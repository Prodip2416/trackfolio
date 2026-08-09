'use client'

import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

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

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316']

export default function DashboardClient({ transactions }: { transactions: Transaction[] }) {
  
  // 1. Calculate Portfolio Allocation (Pie Chart)
  const portfolioData = useMemo(() => {
    const holdings = new Map<string, { symbol: string, totalQty: number, totalInvested: number }>()

    transactions.forEach(txn => {
      const sym = txn.stocks.symbol
      const current = holdings.get(sym) || { symbol: sym, totalQty: 0, totalInvested: 0 }
      
      if (txn.type === 'BUY') {
        current.totalQty += txn.quantity
        current.totalInvested += (txn.quantity * txn.price_per_unit) + txn.brokerage_fee
      } else if (txn.type === 'SELL') {
        current.totalQty -= txn.quantity
        // Rough estimate of value deduction on sell for allocation purposes
        current.totalInvested -= (txn.quantity * txn.price_per_unit) - txn.brokerage_fee
      }
      
      holdings.set(sym, current)
    })

    // Filter out stocks with 0 quantity and map to chart data format
    return Array.from(holdings.values())
      .filter(h => h.totalQty > 0 && h.totalInvested > 0)
      .map(h => ({
        name: h.symbol,
        value: h.totalInvested, // Value used for pie slice size
        qty: h.totalQty
      }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  const totalPortfolioValue = portfolioData.reduce((sum, item) => sum + item.value, 0)

  // 2. Calculate Daily Trade Activity (Bar Chart - Current Month)
  const activityData = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const dailyStats = new Map<string, any>()

    transactions.forEach(txn => {
      const dateObj = new Date(txn.transaction_date)
      if (dateObj.getMonth() !== currentMonth || dateObj.getFullYear() !== currentYear) return

      const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      const current = dailyStats.get(dateStr) || { 
        date: dateStr, 
        buyAmount: 0, buyCount: 0, buyShares: 0,
        sellAmount: 0, sellCount: 0, sellShares: 0 
      }

      if (txn.type === 'BUY') {
        current.buyAmount += (txn.quantity * txn.price_per_unit) + txn.brokerage_fee
        current.buyCount += 1
        current.buyShares += txn.quantity
      } else {
        current.sellAmount += (txn.quantity * txn.price_per_unit) - txn.brokerage_fee
        current.sellCount += 1
        current.sellShares += txn.quantity
      }

      dailyStats.set(dateStr, current)
    })

    // Sort by date chronologically
    return Array.from(dailyStats.values()).sort((a, b) => {
      // Very basic sort since they are all same month/year
      return parseInt(a.date) - parseInt(b.date)
    })
  }, [transactions])

  // Custom Tooltip for Bar Chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
          <p className="font-bold text-gray-900 dark:text-white mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
            {label}
          </p>
          {data.buyCount > 0 && (
            <div className="mb-2">
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center">
                <ArrowDownRight className="w-4 h-4 mr-1" /> BUY ({data.buyCount} trades)
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">Shares: {data.buyShares.toLocaleString()}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">Amount: ৳{data.buyAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          )}
          {data.sellCount > 0 && (
            <div>
              <p className="text-sm font-semibold text-pink-600 dark:text-pink-400 flex items-center">
                <ArrowUpRight className="w-4 h-4 mr-1" /> SELL ({data.sellCount} trades)
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">Shares: {data.sellShares.toLocaleString()}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">Amount: ৳{data.sellAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  // Custom Tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percent = ((data.value / totalPortfolioValue) * 100).toFixed(1)
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
          <p className="font-bold text-gray-900 dark:text-white">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Shares: {data.qty.toLocaleString()}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Invested: ৳{data.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <div className="mt-2 text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md inline-block">
            {percent}% of Portfolio
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4 sm:px-0">
        
        {/* Left: Portfolio Allocation Pie Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Portfolio Allocation</h3>
          
          {portfolioData.length > 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center min-h-[300px]">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={portfolioData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {portfolioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 w-full max-h-32 overflow-y-auto custom-scrollbar flex flex-wrap gap-2 justify-center">
                {portfolioData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center text-xs">
                    <span className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center min-h-[300px] text-gray-400 text-sm">
              No holdings found.
            </div>
          )}
        </div>

        {/* Right: Daily Trade Activity Bar Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Trade Activity</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Current Month (Amount ৳)</p>
          </div>
          
          {activityData.length > 0 ? (
            <div className="flex-grow min-h-[300px]">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={activityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(val) => `৳${(val/1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f3f4f6' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="buyAmount" name="Buy" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="sellAmount" name="Sell" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center min-h-[300px] text-gray-400 text-sm">
              No trades this month.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
