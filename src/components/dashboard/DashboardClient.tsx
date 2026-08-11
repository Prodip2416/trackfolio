'use client'

import { useMemo, useTransition, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, Wallet, PieChart as PieChartIcon, TrendingUp, Activity, Banknote, RefreshCw, ChevronDown, Search } from 'lucide-react'
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

type StockHolding = {
  id: string
  symbol: string
  company_name: string
  sector: string
  total_quantity: number
  total_investment: number
  portfolio_price: number
  current_price: number
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#84cc16', '#3b82f6', '#d946ef', '#f43f5e']

const YearSelect = ({ value, onChange, years }: { value: number, onChange: (val: number) => void, years: number[] }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredYears = years.filter(y => y.toString().includes(search))

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-28 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
      >
        <span>{value}</span>
        <ChevronDown className="w-3.5 h-3.5 ml-2 text-gray-500" />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 z-50 w-36 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden">
            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredYears.length > 0 ? (
                filteredYears.map(year => (
                  <button
                    key={year}
                    onClick={() => {
                      onChange(year)
                      setIsOpen(false)
                      setSearch('')
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${year === value ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    {year}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-gray-500 text-center">No years</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const MonthSelect = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-28 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
      >
        <span>{MONTHS[value].slice(0, 3)}</span>
        <ChevronDown className="w-3.5 h-3.5 ml-2 text-gray-500" />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 z-50 w-32 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden py-1">
            <div className="max-h-48 overflow-y-auto">
              {MONTHS.map((m, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onChange(i)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${i === value ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function DashboardClient({ 
  transactions, 
  dividends,
  stocks,
  lastSyncTime,
  dict
}: { 
  transactions: Transaction[],
  dividends: Dividend[],
  stocks: StockHolding[],
  lastSyncTime?: string | null,
  dict: any
}) {
  
  const [isPending, startTransition] = useTransition()
  const [selectedDividendYear, setSelectedDividendYear] = useState<number>(new Date().getFullYear())
  const [selectedActivityYear, setSelectedActivityYear] = useState<number>(new Date().getFullYear())
  const [selectedActivityMonth, setSelectedActivityMonth] = useState<number>(new Date().getMonth())

  const dividendYears = useMemo(() => {
    const years: number[] = []
    for(let y = 2025; y <= 2075; y++) {
      years.push(y)
    }
    // Include any years from dividends if they are missing
    dividends.forEach(d => {
      const y = new Date(d.date).getFullYear()
      if(!years.includes(y)) years.push(y)
    })
    return years.sort((a, b) => a - b)
  }, [dividends])

  const activityYears = useMemo(() => {
    const years: number[] = []
    for(let y = 2025; y <= 2075; y++) {
      years.push(y)
    }
    transactions.forEach(t => {
      const y = new Date(t.transaction_date).getFullYear()
      if(!years.includes(y)) years.push(y)
    })
    return years.sort((a, b) => a - b)
  }, [transactions])

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
    const totalInvested = stocks.reduce((acc, stock) => acc + stock.total_investment, 0)
    const totalShares = stocks.reduce((acc, stock) => acc + stock.total_quantity, 0)
    const currentPortfolioValue = stocks.reduce((acc, stock) => {
      return acc + (stock.total_quantity * stock.current_price)
    }, 0)
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
  }, [stocks, dividends])

  // 2. Portfolio Allocation (Pie Chart) & Sector Allocation
  const { portfolioData, sectorData, totalPortfolioValue } = useMemo(() => {
    const sectorTotals = new Map<string, number>()
    const validHoldings = stocks.filter(stock => stock.total_quantity > 0 && stock.total_investment > 0)
    
    let totalVal = 0
    validHoldings.forEach(h => {
      totalVal += h.total_investment
      const secVal = sectorTotals.get(h.sector) || 0
      sectorTotals.set(h.sector, secVal + h.total_investment)
    })

    return {
      portfolioData: validHoldings.map(h => ({ name: h.symbol, value: h.total_investment, qty: h.total_quantity })).sort((a, b) => b.value - a.value),
      sectorData: Array.from(sectorTotals.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      totalPortfolioValue: totalVal
    }
  }, [stocks])


  // 3. Daily Trade Activity (Bar Chart - Selected Month)
  const activityData = useMemo(() => {
    const dailyStats = new Map<string, any>()

    transactions.forEach(txn => {
      const dateObj = new Date(txn.transaction_date)
      if (dateObj.getFullYear() !== selectedActivityYear || dateObj.getMonth() !== selectedActivityMonth) return

      const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      const current = dailyStats.get(dateStr) || { 
        date: dateStr, 
        buyAmount: 0, buyCount: 0, buyShares: 0, buyDetails: [],
        sellAmount: 0, sellCount: 0, sellShares: 0, sellDetails: []
      }

      if (txn.type === 'BUY') {
        const amount = (txn.quantity * txn.price_per_unit) + txn.brokerage_fee
        current.buyAmount += amount
        current.buyCount += 1
        current.buyShares += txn.quantity
        
        const existing = current.buyDetails.find((d: any) => d.symbol === txn.stocks.symbol)
        if (existing) {
          existing.quantity += txn.quantity
          existing.amount += amount
        } else {
          current.buyDetails.push({ symbol: txn.stocks.symbol, quantity: txn.quantity, amount })
        }
      } else {
        const amount = (txn.quantity * txn.price_per_unit) - txn.brokerage_fee
        current.sellAmount += amount
        current.sellCount += 1
        current.sellShares += txn.quantity
        
        const existing = current.sellDetails.find((d: any) => d.symbol === txn.stocks.symbol)
        if (existing) {
          existing.quantity += txn.quantity
          existing.amount += amount
        } else {
          current.sellDetails.push({ symbol: txn.stocks.symbol, quantity: txn.quantity, amount })
        }
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
  }, [transactions, selectedActivityYear, selectedActivityMonth])


  // 4. Dividend History (Bar Chart - Selected Year)
  const dividendHistoryData = useMemo(() => {
    const monthlyStats = new Map<string, { amount: number, details: { symbol: string, amount: number }[] }>()
    
    // Initialize 12 months for the selected year
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    months.forEach(m => {
      monthlyStats.set(`${m} ${selectedDividendYear.toString().slice(-2)}`, { amount: 0, details: [] })
    })

    dividends.forEach(div => {
      const dateObj = new Date(div.date)
      if (dateObj.getFullYear() === selectedDividendYear) {
        const key = dateObj.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
        if (monthlyStats.has(key) && div.cash_amount) {
          const stat = monthlyStats.get(key)!
          stat.amount += div.cash_amount
          const existing = stat.details.find(d => d.symbol === div.stocks.symbol)
          if (existing) {
            existing.amount += div.cash_amount
          } else {
            stat.details.push({ symbol: div.stocks.symbol, amount: div.cash_amount })
          }
        }
      }
    })

    return Array.from(monthlyStats.entries()).map(([date, data]) => ({
      date, 
      amount: data.amount,
      details: data.details.sort((a, b) => b.amount - a.amount)
    }))
  }, [dividends, selectedDividendYear])

  const selectedYearTotalDividend = useMemo(() => {
    return dividendHistoryData.reduce((acc, curr) => acc + curr.amount, 0)
  }, [dividendHistoryData])


  // Tooltips
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg min-w-[200px]">
          <p className="font-bold text-gray-900 dark:text-white mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
            {label}
          </p>
          {data.buyCount > 0 && (
            <div className="mb-3">
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center mb-1">
                <ArrowDownRight className="w-4 h-4 mr-1" /> {dict.dashboard.buy} 
                <span className="text-xs text-gray-500 ml-1">({data.buyCount} trades)</span>
              </p>
              <div className="space-y-1 mb-1.5">
                {data.buyDetails.map((d: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      {d.symbol} <span className="text-gray-400">({d.quantity.toLocaleString()})</span>
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 font-bold ml-3">
                      ৳{d.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 border-t border-gray-100 dark:border-gray-700 pt-1 mt-1 text-right">
                Total: ৳{data.buyAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          )}
          
          {data.sellCount > 0 && (
            <div>
              <p className="text-sm font-semibold text-pink-600 dark:text-pink-400 flex items-center mb-1">
                <ArrowUpRight className="w-4 h-4 mr-1" /> {dict.dashboard.sell} 
                <span className="text-xs text-gray-500 ml-1">({data.sellCount} trades)</span>
              </p>
              <div className="space-y-1 mb-1.5">
                {data.sellDetails.map((d: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      {d.symbol} <span className="text-gray-400">({d.quantity.toLocaleString()})</span>
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 font-bold ml-3">
                      ৳{d.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] font-bold text-pink-700 dark:text-pink-300 border-t border-gray-100 dark:border-gray-700 pt-1 mt-1 text-right">
                Total: ৳{data.sellAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
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
            <p className="text-[10px] text-gray-600 dark:text-gray-300 mt-1">{dict.dashboard.shares}: {data.qty.toLocaleString()}</p>
          )}
          <p className="text-[10px] text-gray-600 dark:text-gray-300 mt-0.5">{dict.dashboard.invested}: ৳{data.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
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
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg min-w-[160px]">
          <p className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-1.5 mb-1.5">{label}</p>
          <p className="text-xs font-bold text-emerald-600 mb-2">
            Total: ৳{data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {data.details && data.details.length > 0 && (
            <div className="space-y-1.5">
              {data.details.map((d: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-600 dark:text-gray-300 font-medium">{d.symbol}</span>
                  <span className="text-gray-900 dark:text-gray-100 font-bold ml-4">৳{d.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          )}
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
      
      {/* 1. KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invested */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-900 p-4 rounded-xl border border-indigo-100/50 dark:border-indigo-800/30 shadow-md shadow-indigo-100/20 dark:shadow-none flex flex-col justify-between">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] font-semibold text-indigo-600/70 dark:text-indigo-400 uppercase tracking-wider mb-0.5">{dict.dashboard.totalInvested}</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                ৳{kpis.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="p-2 bg-indigo-100/50 dark:bg-indigo-900/50 rounded-lg backdrop-blur-sm">
              <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-2xl"></div>
        </div>
        
        {/* Total Dividend */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-900 p-4 rounded-xl border border-emerald-100/50 dark:border-emerald-800/30 shadow-md shadow-emerald-100/20 dark:shadow-none flex flex-col justify-between">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] font-semibold text-emerald-600/70 dark:text-emerald-400 uppercase tracking-wider mb-0.5">{dict.dashboard.totalDividend}</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                ৳{kpis.totalDividend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="p-2 bg-emerald-100/50 dark:bg-emerald-900/50 rounded-lg backdrop-blur-sm">
              <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-400/10 dark:bg-emerald-600/10 rounded-full blur-2xl"></div>
        </div>
        
        {/* Total Shares */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-900 p-4 rounded-xl border border-amber-100/50 dark:border-amber-800/30 shadow-md shadow-amber-100/20 dark:shadow-none flex flex-col justify-between">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] font-semibold text-amber-600/70 dark:text-amber-400 uppercase tracking-wider mb-0.5">{dict.dashboard.totalShares}</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {kpis.totalShares.toLocaleString()}
              </h2>
            </div>
            <div className="p-2 bg-amber-100/50 dark:bg-amber-900/50 rounded-lg backdrop-blur-sm">
              <PieChartIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-400/10 dark:bg-amber-600/10 rounded-full blur-2xl"></div>
        </div>
        
        {/* Unrealized Profit/Loss */}
        <div className={`relative overflow-hidden bg-gradient-to-br p-4 rounded-xl border shadow-md flex flex-col justify-between ${kpis.totalProfitLoss > 0 ? 'from-green-50 to-white dark:from-green-900/20 dark:to-gray-900 border-green-100/50 dark:border-green-800/30 shadow-green-100/20 dark:shadow-none' : kpis.totalProfitLoss < 0 ? 'from-rose-50 to-white dark:from-rose-900/20 dark:to-gray-900 border-rose-100/50 dark:border-rose-800/30 shadow-rose-100/20 dark:shadow-none' : 'from-gray-50 to-white dark:from-gray-900/20 dark:to-gray-900 border-gray-100/50 dark:border-gray-800/30 shadow-gray-100/20 dark:shadow-none'}`}>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${kpis.totalProfitLoss > 0 ? 'text-green-600/70 dark:text-green-400' : kpis.totalProfitLoss < 0 ? 'text-rose-600/70 dark:text-rose-400' : 'text-gray-500'}`}>{dict.dashboard.unrealizedPL}</p>
              <h2 className={`text-xl font-bold ${kpis.totalProfitLoss > 0 ? 'text-green-600 dark:text-green-400' : kpis.totalProfitLoss < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
                {kpis.totalProfitLoss > 0 ? '+' : ''}৳{kpis.totalProfitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className={`p-2 rounded-lg backdrop-blur-sm ${kpis.totalProfitLoss > 0 ? 'bg-green-100/50 dark:bg-green-900/50' : kpis.totalProfitLoss < 0 ? 'bg-rose-100/50 dark:bg-rose-900/50' : 'bg-gray-100/50 dark:bg-gray-800/50'}`}>
              <TrendingUp className={`w-4 h-4 ${kpis.totalProfitLoss > 0 ? 'text-green-600 dark:text-green-400' : kpis.totalProfitLoss < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400'}`} />
            </div>
          </div>
          <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl ${kpis.totalProfitLoss > 0 ? 'bg-green-400/10 dark:bg-green-600/10' : kpis.totalProfitLoss < 0 ? 'bg-rose-400/10 dark:bg-rose-600/10' : 'bg-gray-400/10 dark:bg-gray-600/10'}`}></div>
        </div>
      </div>

      {/* 2. Charts Row 1: Pie Charts + Trade Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left: Portfolio Allocation */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{dict.dashboard.portfolioAllocation}</h3>
          
          {portfolioData.length > 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center min-h-[220px]">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={portfolioData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {portfolioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="dark:hidden">
                    <tspan x="50%" dy="-0.5em" fontSize="11" fill="#6b7280" fontWeight="600">{dict.dashboard.totalValue}</tspan>
                    <tspan x="50%" dy="1.5em" fontSize="13" fill="#111827" fontWeight="900">
                      ৳{(totalPortfolioValue / 1000).toFixed(0)}k
                    </tspan>
                  </text>
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="hidden dark:block">
                    <tspan x="50%" dy="-0.5em" fontSize="11" fill="#9ca3af" fontWeight="600">{dict.dashboard.totalValue}</tspan>
                    <tspan x="50%" dy="1.5em" fontSize="13" fill="#f3f4f6" fontWeight="900">
                      ৳{(totalPortfolioValue / 1000).toFixed(0)}k
                    </tspan>
                  </text>
                  <RechartsTooltip content={<CustomPieTooltip type="portfolio" />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center min-h-[200px] text-gray-400 text-sm">
              {dict.dashboard.noHoldings}
            </div>
          )}
        </div>

        {/* Middle: Sector Allocation */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{dict.dashboard.sectorAllocation}</h3>
          
          {sectorData.length > 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center min-h-[220px]">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="dark:hidden">
                    <tspan x="50%" dy="-0.5em" fontSize="11" fill="#6b7280" fontWeight="600">{dict.dashboard.sectors}</tspan>
                    <tspan x="50%" dy="1.5em" fontSize="14" fill="#111827" fontWeight="900">
                      {sectorData.length}
                    </tspan>
                  </text>
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="hidden dark:block">
                    <tspan x="50%" dy="-0.5em" fontSize="11" fill="#9ca3af" fontWeight="600">{dict.dashboard.sectors}</tspan>
                    <tspan x="50%" dy="1.5em" fontSize="14" fill="#f3f4f6" fontWeight="900">
                      {sectorData.length}
                    </tspan>
                  </text>
                  <RechartsTooltip content={<CustomPieTooltip type="sector" />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center min-h-[200px] text-gray-400 text-sm">
              {dict.dashboard.noSectorData}
            </div>
          )}
        </div>

        {/* Right: Daily Trade Activity Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
          <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{dict.dashboard.tradeActivity}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{dict.dashboard.dailyBreakdown}</p>
            </div>
            <div className="flex items-center space-x-2">
              <YearSelect value={selectedActivityYear} onChange={setSelectedActivityYear} years={activityYears} />
              <MonthSelect value={selectedActivityMonth} onChange={setSelectedActivityMonth} />
            </div>
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
              {dict.dashboard.noTrades}
            </div>
          )}
        </div>

      </div>

      {/* 3. Dividend History Row */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{dict.dashboard.dividendIncome}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{dict.dashboard.monthlyBreakdown}</p>
          </div>
          <div className="flex items-center space-x-4">
            <YearSelect 
              value={selectedDividendYear}
              onChange={(y) => setSelectedDividendYear(y)}
              years={dividendYears}
            />
            <div className="text-right hidden sm:block bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
              <p className="text-[13px] font-extrabold text-emerald-600 dark:text-emerald-400">
                ৳{selectedYearTotalDividend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
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
              <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Recent Trades Row */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden w-full">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{dict.dashboard.recentTrades}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
            <thead className="bg-white dark:bg-gray-800/30">
              <tr>
                <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{dict.dashboard.symbol}</th>
                <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{dict.dashboard.date}</th>
                <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{dict.dashboard.type}</th>
                <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{dict.dashboard.quantity}</th>
                <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{dict.dashboard.price}</th>
                <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{dict.dashboard.current}</th>
                <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">{dict.dashboard.total}</th>
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
                        <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{txn.stocks.company_name}</div>
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
  )
}
