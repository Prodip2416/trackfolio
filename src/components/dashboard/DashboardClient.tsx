'use client'

import { useMemo, useTransition, useState } from 'react'
import { syncDashboardData } from '@/app/dashboard/actions'
import toast from 'react-hot-toast'
import { useTheme } from 'next-themes'
import DashboardSummaryCards from './DashboardSummaryCards'
import DashboardPieCharts from './DashboardPieCharts'
import DashboardBarCharts from './DashboardBarCharts'
import RecentTradesTable from './RecentTradesTable'
import { motion, Variants } from 'framer-motion'

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
  const { theme } = useTheme()
  const [isPending, startTransition] = useTransition()
  const [selectedDividendYear, setSelectedDividendYear] = useState<number>(new Date().getFullYear())
  const [selectedActivityYear, setSelectedActivityYear] = useState<number>(new Date().getFullYear())
  const [selectedSellYear, setSelectedSellYear] = useState<number>(new Date().getFullYear())

  const dividendYears = useMemo(() => {
    const years: number[] = []
    for(let y = 2025; y <= 2075; y++) {
      years.push(y)
    }
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

  const sellYears = useMemo(() => {
    const years: number[] = []
    for(let y = 2025; y <= 2075; y++) {
      years.push(y)
    }
    transactions.forEach(t => {
      if (t.type === 'SELL') {
        const y = new Date(t.transaction_date).getFullYear()
        if(!years.includes(y)) years.push(y)
      }
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
    const totalSellAmount = transactions.reduce((acc, txn) => {
      if (txn.type === 'SELL') {
        return acc + ((txn.quantity * txn.price_per_unit) - txn.brokerage_fee)
      }
      return acc
    }, 0)
    
    const totalProfitLoss = currentPortfolioValue - totalInvested

    let totalRealizedPL = 0;
    const stockMap = new Map<string, { totalBuyCost: number; totalBuyQty: number; realizedPL: number }>();
    
    // Sort transactions by date first (oldest to newest) to accurately calculate average buy price at time of sale
    const sortedTxns = [...transactions].sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());
    
    sortedTxns.forEach(txn => {
      const symbol = txn.stocks?.symbol || 'Unknown';
      if (!stockMap.has(symbol)) {
        stockMap.set(symbol, { totalBuyCost: 0, totalBuyQty: 0, realizedPL: 0 });
      }
      
      const stock = stockMap.get(symbol)!;
      
      if (txn.type === 'BUY') {
        const cost = (txn.quantity * txn.price_per_unit) + txn.brokerage_fee;
        stock.totalBuyCost += cost;
        stock.totalBuyQty += txn.quantity;
      } else if (txn.type === 'SELL') {
        const netSell = (txn.quantity * txn.price_per_unit) - txn.brokerage_fee;
        const avgBuyPrice = stock.totalBuyQty > 0 ? (stock.totalBuyCost / stock.totalBuyQty) : 0;
        const costBasisOfSold = avgBuyPrice * txn.quantity;
        
        stock.realizedPL += (netSell - costBasisOfSold);
        
        stock.totalBuyQty -= txn.quantity;
        stock.totalBuyCost -= costBasisOfSold;
      }
    });

    stockMap.forEach(stock => {
      totalRealizedPL += stock.realizedPL;
    });

    return { 
      totalInvested: Math.max(0, totalInvested), 
      totalDividend, 
      totalShares: Math.max(0, totalShares), 
      totalProfitLoss,
      realizedPL: totalRealizedPL,
      currentPortfolioValue,
      totalSellAmount: Math.max(0, totalSellAmount)
    }
  }, [stocks, dividends, transactions])

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


  // 3. Trade Activity (Bar Chart - Monthly Breakdown)
  const activityData = useMemo(() => {
    const monthlyStats = new Map<string, any>()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    months.forEach(m => {
      monthlyStats.set(`${m} ${selectedActivityYear.toString().slice(-2)}`, { 
        date: `${m} ${selectedActivityYear.toString().slice(-2)}`, 
        buyAmount: 0, buyCount: 0, buyShares: 0, buyDetails: [],
        sellAmount: 0, sellCount: 0, sellShares: 0, sellDetails: []
      })
    })

    transactions.forEach(txn => {
      const dateObj = new Date(txn.transaction_date)
      if (dateObj.getFullYear() !== selectedActivityYear) return

      const key = dateObj.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      const current = monthlyStats.get(key)
      if (!current) return

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
    })

    return Array.from(monthlyStats.values()).map(data => {
      data.buyDetails.sort((a: any, b: any) => b.amount - a.amount)
      data.sellDetails.sort((a: any, b: any) => b.amount - a.amount)
      return data
    })
  }, [transactions, selectedActivityYear])


  // 4. Dividend History (Bar Chart - Selected Year)
  const dividendHistoryData = useMemo(() => {
    const monthlyStats = new Map<string, { amount: number, details: { symbol: string, amount: number }[] }>()
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


  // 5. Sell History (Bar Chart - Selected Year)
  const sellHistoryData = useMemo(() => {
    const monthlyStats = new Map<string, { amount: number, details: { symbol: string, amount: number, quantity: number }[] }>()

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    months.forEach(m => {
      monthlyStats.set(`${m} ${selectedSellYear.toString().slice(-2)}`, { amount: 0, details: [] })
    })

    transactions.forEach(txn => {
      if (txn.type !== 'SELL') return
      const dateObj = new Date(txn.transaction_date)
      if (dateObj.getFullYear() === selectedSellYear) {
        const key = dateObj.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
        if (monthlyStats.has(key)) {
          const stat = monthlyStats.get(key)!
          const amount = (txn.quantity * txn.price_per_unit) - txn.brokerage_fee
          stat.amount += amount
          const existing = stat.details.find(d => d.symbol === txn.stocks.symbol)
          if (existing) {
            existing.amount += amount
            existing.quantity += txn.quantity
          } else {
            stat.details.push({ symbol: txn.stocks.symbol, amount, quantity: txn.quantity })
          }
        }
      }
    })

    return Array.from(monthlyStats.entries()).map(([date, data]) => ({
      date,
      amount: data.amount,
      details: data.details.sort((a, b) => b.amount - a.amount)
    }))
  }, [transactions, selectedSellYear])

  const selectedYearTotalSell = useMemo(() => {
    return sellHistoryData.reduce((acc, curr) => acc + curr.amount, 0)
  }, [sellHistoryData])

  // 6. Recent Trades
  const recentTrades = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
      .slice(0, 5)
  }, [transactions])


  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full space-y-3 px-4 sm:px-0"
    >
      
      <motion.div variants={itemVariants}>
        <DashboardSummaryCards kpis={kpis} dict={dict} />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <DashboardPieCharts 
          portfolioData={portfolioData} 
          sectorData={sectorData} 
          totalPortfolioValue={totalPortfolioValue} 
          dict={dict} 
          COLORS={COLORS} 
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <DashboardBarCharts 
          activityData={activityData}
          dividendHistoryData={dividendHistoryData}
          sellHistoryData={sellHistoryData}
          selectedActivityYear={selectedActivityYear}
          selectedDividendYear={selectedDividendYear}
          selectedSellYear={selectedSellYear}
          activityYears={activityYears}
          dividendYears={dividendYears}
          sellYears={sellYears}
          setSelectedActivityYear={setSelectedActivityYear}
          setSelectedDividendYear={setSelectedDividendYear}
          setSelectedSellYear={setSelectedSellYear}
          selectedYearTotalDividend={selectedYearTotalDividend}
          selectedYearTotalSell={selectedYearTotalSell}
          dict={dict}
          theme={theme}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <RecentTradesTable recentTrades={recentTrades} dict={dict} />
      </motion.div>
      
    </motion.div>
  )
}
