'use client'

import { useMemo, useTransition } from 'react'
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, Wallet, PieChart as PieChartIcon, TrendingUp, Activity, Banknote, RefreshCw } from 'lucide-react'
import { syncDashboardData } from '@/app/dashboard/actions'
import toast from 'react-hot-toast'

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
    sector: string | null
    current_price: number | null
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
    sector: string | null
  }
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#84cc16', '#3b82f6', '#d946ef', '#f43f5e']

export default function DashboardClient({ 
  transactions, 
  dividends 
}: { 
  transactions: Transaction[], 
  dividends: Dividend[] 
}) {
  
  const [isPending, startTransition] = useTransition()

  const handleSync = () => {
    startTransition(async () => {
      try {
        await syncDashboardData()
        toast.success("Prices synced successfully")
      } catch (err: any) {
        console.error("Failed to sync:", err)
        toast.error(err.message || "Failed to sync prices")
      }
    })
  }

  // 1. Calculate KPI Metrics
  const kpis = useMemo(() => {
    let totalInvested = 0
    let totalShares = 0
    let currentPortfolioValue = 0

    // To accurately calculate current portfolio value, we need net quantity per stock
    const holdings = new Map<string, { qty: number, invested: number, currentPrice: number }>()

    transactions.forEach(txn => {
      const sym = txn.stocks.symbol
      const current = holdings.get(sym) || { qty: 0, invested: 0, currentPrice: txn.stocks.current_price || 0 }
      
      if (txn.type === 'BUY') {
        current.qty += txn.quantity
        current.invested += (txn.quantity * txn.price_per_unit) + txn.brokerage_fee
      } else {
        current.qty -= txn.quantity
        current.invested -= (txn.quantity * txn.price_per_unit) - txn.brokerage_fee
      }
      holdings.set(sym, current)
    })

    holdings.forEach(h => {
      if (h.qty > 0) {
        totalInvested += h.invested
        totalShares += h.qty
        currentPortfolioValue += (h.qty * h.currentPrice)
      }
    })

    const totalDividend = dividends.reduce((acc, div) => acc + (div.cash_amount || 0), 0)
    
    // Unrealized P/L = Current Value - Invested Value
    const totalProfitLoss = currentPortfolioValue > 0 ? (currentPortfolioValue - totalInvested) : 0

    return { 
      totalInvested: Math.max(0, totalInvested), 
      totalDividend, 
      totalShares: Math.max(0, totalShares), 
      totalProfitLoss,
      currentPortfolioValue
    }
  }, [transactions, dividends])

  // 2. Portfolio Allocation (Pie Chart) & Sector Allocation
  const { portfolioData, sectorData, totalPortfolioValue } = useMemo(() => {
    const holdings = new Map<string, { symbol: string, totalQty: number, totalInvested: number, sector: string }>()
    const sectorTotals = new Map<string, number>()

    transactions.forEach(txn => {
      const sym = txn.stocks.symbol
      const sector = txn.stocks.sector || 'Others'
      const current = holdings.get(sym) || { symbol: sym, totalQty: 0, totalInvested: 0, sector }
      
      if (txn.type === 'BUY') {
        current.totalQty += txn.quantity
        current.totalInvested += (txn.quantity * txn.price_per_unit) + txn.brokerage_fee
      } else if (txn.type === 'SELL') {
        current.totalQty -= txn.quantity
        current.totalInvested -= (txn.quantity * txn.price_per_unit) - txn.brokerage_fee
      }
      
      holdings.set(sym, current)
    })

    const validHoldings = Array.from(holdings.values()).filter(h => h.totalQty > 0 && h.totalInvested > 0)
    
    let totalVal = 0
    validHoldings.forEach(h => {
      totalVal += h.totalInvested
      const secVal = sectorTotals.get(h.sector) || 0
      sectorTotals.set(h.sector, secVal + h.totalInvested)
    })

    return {
      portfolioData: validHoldings.map(h => ({ name: h.symbol, value: h.totalInvested, qty: h.totalQty })).sort((a, b) => b.value - a.value),
      sectorData: Array.from(sectorTotals.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      totalPortfolioValue: totalVal
    }
  }, [transactions])


  // 3. Daily Trade Activity (Bar Chart - Last 30 Days)
  const activityData = useMemo(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const dailyStats = new Map<string, any>()

    transactions.forEach(txn => {
      const dateObj = new Date(txn.transaction_date)
      if (dateObj < thirtyDaysAgo || dateObj > today) return

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

    return Array.from(dailyStats.values()).sort((a, b) => {
      // Create actual date objects to sort properly
      const getRealDate = (dStr: string) => {
        const [day, monthStr] = dStr.split(' ')
        const monthIndex = new Date(`${monthStr} 1 2000`).getMonth()
        const d = new Date()
        d.setMonth(monthIndex)
        d.setDate(parseInt(day))
        // Handle year wrap-around
        if (d > new Date()) d.setFullYear(d.getFullYear() - 1)
        return d.getTime()
      }
      return getRealDate(a.date) - getRealDate(b.date)
    })
  }, [transactions])


  // 4. Dividend History (Bar Chart - Last 12 Months)
  const dividendHistoryData = useMemo(() => {
    const today = new Date()
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(today.getMonth() - 11) // Last 12 months including current
    twelveMonthsAgo.setDate(1)
    twelveMonthsAgo.setHours(0,0,0,0)

    const monthlyStats = new Map<string, number>()

    // Initialize last 12 months to 0
    for(let i = 0; i < 12; i++) {
      const d = new Date()
      d.setMonth(today.getMonth() - i)
      const key = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      monthlyStats.set(key, 0)
    }

    dividends.forEach(div => {
      const dateObj = new Date(div.date)
      if (dateObj < twelveMonthsAgo) return
      
      const key = dateObj.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      if(monthlyStats.has(key) && div.cash_amount) {
        monthlyStats.set(key, monthlyStats.get(key)! + div.cash_amount)
      }
    })

    // Map needs to be reversed so chronological order is maintained
    return Array.from(monthlyStats.entries()).reverse().map(([date, amount]) => ({
      date, amount
    }))
  }, [dividends])


  // Tooltips
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

  const CustomPieTooltip = ({ active, payload, type }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percent = ((data.value / totalPortfolioValue) * 100).toFixed(1)
      return (
        <div className="bg-white dark:bg-gray-800 p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
          <p className="font-bold text-gray-900 dark:text-white text-xs">{data.name}</p>
          {type === 'portfolio' && (
            <p className="text-[10px] text-gray-600 dark:text-gray-300 mt-1">Shares: {data.qty.toLocaleString()}</p>
          )}
          <p className="text-[10px] text-gray-600 dark:text-gray-300 mt-0.5">Invested: ৳{data.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <div className="mt-1.5 text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md inline-block">
            {percent}%
          </div>
        </div>
      )
    }
    return null
  }

  const CustomDividendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
          <p className="font-bold text-gray-900 dark:text-white">{label}</p>
          <p className="text-sm font-bold text-green-600 mt-1">
            Cash: ৳{payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      )
    }
    return null
  }

  // 5. Recent Trades
  const recentTrades = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
      .slice(0, 5)
  }, [transactions])


  return (
    <div className="w-full space-y-6 px-4 sm:px-0">
      
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Dashboard</h1>
        <button
          onClick={handleSync}
          disabled={isPending}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-70 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isPending ? 'animate-spin' : ''}`} />
          {isPending ? 'Syncing...' : 'Sync Live Prices'}
        </button>
      </div>

      {/* 1. KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invested */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Total Invested</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                ৳{kpis.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
        
        {/* Total Dividend */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Total Dividend</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                ৳{kpis.totalDividend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <Banknote className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        
        {/* Total Shares */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Total Shares</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {kpis.totalShares.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <PieChartIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
        
        {/* Unrealized Profit/Loss */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Unrealized P/L</p>
              <h2 className={`text-xl font-bold ${kpis.totalProfitLoss > 0 ? 'text-green-600 dark:text-green-400' : kpis.totalProfitLoss < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                {kpis.totalProfitLoss > 0 ? '+' : ''}৳{kpis.totalProfitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className={`p-2 rounded-lg border ${kpis.totalProfitLoss > 0 ? 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800' : kpis.totalProfitLoss < 0 ? 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800' : 'bg-gray-50 border-gray-100 dark:bg-gray-800 dark:border-gray-700'}`}>
              <TrendingUp className={`w-4 h-4 ${kpis.totalProfitLoss > 0 ? 'text-green-600' : kpis.totalProfitLoss < 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Charts Row 1: Pie Charts + Trade Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left: Portfolio Allocation */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Portfolio Allocation</h3>
          
          {portfolioData.length > 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center min-h-[200px]">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={portfolioData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {portfolioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomPieTooltip type="portfolio" />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center min-h-[200px] text-gray-400 text-sm">
              No holdings found.
            </div>
          )}
        </div>

        {/* Middle: Sector Allocation */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Sector Allocation</h3>
          
          {sectorData.length > 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center min-h-[200px]">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomPieTooltip type="sector" />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center min-h-[200px] text-gray-400 text-sm">
              No sector data found.
            </div>
          )}
        </div>

        {/* Right: Daily Trade Activity Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Trade Activity</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last 30 Days (Amount ৳)</p>
          </div>
          
          {activityData.length > 0 ? (
            <div className="flex-grow min-h-[200px]">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 10 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickFormatter={(val) => `৳${(val/1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: '#f3f4f6' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="buyAmount" name="Buy" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="sellAmount" name="Sell" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center min-h-[200px] text-gray-400 text-sm">
              No trades in last 30 days.
            </div>
          )}
        </div>

      </div>

      {/* 3. Charts Row 2: Dividend History + Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Left: Dividend History */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Dividend Income</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last 12 Months (Amount ৳)</p>
          </div>
          
          <div className="flex-grow min-h-[250px]">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dividendHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 10 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  tickFormatter={(val) => `৳${(val/1000).toFixed(0)}k`}
                />
                <RechartsTooltip content={<CustomDividendTooltip />} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Recent Trades Table */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden h-full">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Trades</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                <thead className="bg-white dark:bg-gray-800/50">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Symbol</th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Price (৳)</th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Current (৳)</th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Total (৳)</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-50 dark:divide-gray-800">
                  {recentTrades.length > 0 ? (
                    recentTrades.map((txn) => {
                      const total = (txn.quantity * txn.price_per_unit) + (txn.type === 'BUY' ? txn.brokerage_fee : -txn.brokerage_fee)
                      return (
                        <tr key={txn.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-[13px] font-bold text-gray-900 dark:text-white">{txn.stocks.symbol}</div>
                            <div className="text-[10px] text-gray-500 truncate max-w-[120px]">{txn.stocks.company_name}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-[12px] font-medium text-gray-500">
                            {new Date(txn.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                              txn.type === 'BUY' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400'
                            }`}>
                              {txn.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-900 dark:text-white text-right font-semibold">
                            {txn.quantity.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-900 dark:text-white text-right">
                            {txn.price_per_unit.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-[12px] text-indigo-600 dark:text-indigo-400 font-semibold text-right">
                            {txn.stocks.current_price ? txn.stocks.current_price.toFixed(2) : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-[12px] font-bold text-gray-900 dark:text-white text-right hidden sm:table-cell">
                            {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[13px] text-gray-500">
                        No trades found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
