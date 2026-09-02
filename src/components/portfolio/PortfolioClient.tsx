'use client'

import { useMemo, useState } from 'react'
import { Briefcase, TrendingUp, ChevronLeft, ChevronRight, Calculator, Wallet, DollarSign, Activity, Eye, X, History, ArrowRightLeft, Coins, FileText, PieChart } from 'lucide-react'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import AverageDownCalculator from './AverageDownCalculator'
import { getStockHistory } from '@/app/portfolio/actions'

type StockHolding = {
  id: string
  symbol: string
  company_name: string
  category: string
  latest_price: number
  total_quantity: number
  average_buy_price: number
  portfolio_price: number
  total_investment: number
  updated_at: string
}

type TransactionHistoryItem = {
  id: string
  type: string
  date: string
  quantity: number
  price: number
  fee: number
  total: number
}

export default function PortfolioClient({ 
  stocks,
  currentPage,
  totalPages,
  globalTotalInvestment,
  globalCurrentValue,
  globalTotalShares,
  globalActiveStocksCount,
  dict
}: { 
  stocks: StockHolding[]
  currentPage: number
  totalPages: number
  globalTotalInvestment: number
  globalCurrentValue: number
  globalTotalShares: number
  globalActiveStocksCount: number
  dict: Record<string, any>
}) {
  const [selectedStockForCalc, setSelectedStockForCalc] = useState<StockHolding | null>(null)

  // Drawer state
  const [selectedStockDetails, setSelectedStockDetails] = useState<StockHolding | null>(null)
  const [stockHistory, setStockHistory] = useState<TransactionHistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const openDetailsDrawer = async (stock: StockHolding) => {
    setSelectedStockDetails(stock)
    setIsLoadingHistory(true)
    setStockHistory([])
    try {
      const history = await getStockHistory(stock.id)
      setStockHistory(history)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Data is now pre-sorted by total_investment from the server-side pagination query
  const sortedStocks = stocks;

  const globalTotalPL = globalCurrentValue - globalTotalInvestment;
  const globalTotalPLPercent = globalTotalInvestment > 0 ? (globalTotalPL / globalTotalInvestment) * 100 : 0;

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
      className="w-full"
    >
      <div className="px-4 sm:px-0">
        
        {/* Portfolio Summary Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 mb-3">
          <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }} className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center space-x-2.5 cursor-pointer">
            <div className="p-2 sm:p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex-shrink-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">Total Invested</p>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                <AnimatedCounter value={globalTotalInvestment} prefix="৳" decimals={2} />
              </h3>
            </div>
          </motion.div>
          <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }} className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center space-x-2.5 cursor-pointer">
            <div className="p-2 sm:p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex-shrink-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">Current Value</p>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                <AnimatedCounter value={globalCurrentValue} prefix="৳" decimals={2} />
              </h3>
            </div>
          </motion.div>
          <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }} className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center space-x-2.5 cursor-pointer">
            <div className={`p-2 sm:p-2.5 rounded-xl flex-shrink-0 ${globalTotalPL >= 0 ? 'bg-green-50 dark:bg-green-900/30' : 'bg-rose-50 dark:bg-rose-900/30'}`}>
              <TrendingUp className={`w-4 h-4 sm:w-5 sm:h-5 ${globalTotalPL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">Total P/L</p>
              <div className="flex flex-col xl:flex-row xl:items-baseline sm:space-x-1">
                <h3 className={`text-sm sm:text-base font-bold truncate ${globalTotalPL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  <AnimatedCounter value={globalTotalPL} prefix={globalTotalPL >= 0 ? '+৳' : '৳'} decimals={2} />
                </h3>
                <span className={`text-[9px] sm:text-[10px] font-bold ${globalTotalPL >= 0 ? 'text-green-600/80 dark:text-green-400/80' : 'text-rose-600/80 dark:text-rose-400/80'}`}>
                  ({globalTotalPL >= 0 ? '+' : ''}{globalTotalPLPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </motion.div>
          <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }} className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center space-x-2.5 cursor-pointer">
            <div className="p-2 sm:p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex-shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">Active Stocks</p>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                <AnimatedCounter value={globalActiveStocksCount} />
              </h3>
            </div>
          </motion.div>
          <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }} className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center space-x-2.5 cursor-pointer">
            <div className="p-2 sm:p-2.5 bg-cyan-50 dark:bg-cyan-900/30 rounded-xl flex-shrink-0">
              <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">Total Shares</p>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                <AnimatedCounter value={globalTotalShares} decimals={0} />
              </h3>
            </div>
          </motion.div>
        </motion.div>

        {/* Premium Data Table */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 shadow-xl shadow-gray-200/50 dark:shadow-none rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800">
              <thead className="bg-gray-100/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-2 sm:px-3 py-1.5 text-left text-[10px] sm:text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Stock</th>
                  <th scope="col" className="px-2 sm:px-3 py-1.5 text-center text-[10px] sm:text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Cat</th>
                  <th scope="col" className="px-2 sm:px-3 py-1.5 text-right text-[10px] sm:text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict.dashboard.shares}</th>
                  <th scope="col" className="px-2 sm:px-3 py-1.5 text-right text-[10px] sm:text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict.portfolio.avgCost}</th>
                  <th scope="col" className="px-2 sm:px-3 py-1.5 text-right text-[10px] sm:text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict.portfolio.marketPrice}</th>
                  <th scope="col" className="px-2 sm:px-3 py-1.5 text-right text-[10px] sm:text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Portfolio Price</th>
                  <th scope="col" className="px-2 sm:px-3 py-1.5 text-right text-[10px] sm:text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Alloc %</th>
                  <th scope="col" className="px-2 sm:px-3 py-1.5 text-right text-[10px] sm:text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict.dashboard.totalInvested}</th>
                  <th scope="col" className="px-2 sm:px-3 py-1.5 text-right text-[10px] sm:text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Unrealized P/L</th>
                  <th scope="col" className="px-2 sm:px-3 py-1.5 text-right text-[10px] sm:text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict.dashboard.date}</th>
                  <th scope="col" className="px-2 sm:px-3 py-1.5 text-center text-[10px] sm:text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                {sortedStocks.length > 0 ? (
                  sortedStocks.map((stock) => (
                    <tr key={stock.id} className="even:bg-gray-50/60 dark:even:bg-slate-800/40 odd:bg-white dark:odd:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-slate-800 transition-colors duration-200 group">
                      <td className="px-2 sm:px-3 py-1.5">
                        <div className="flex items-center max-w-[120px] sm:max-w-[160px]">
                          <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-slate-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold shadow-sm border border-indigo-100/50 dark:border-indigo-800 mr-2 sm:mr-3 text-xs">
                            {stock.symbol.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate" title={stock.symbol}>{stock.symbol}</div>
                            <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500 truncate" title={stock.company_name}>{stock.company_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-1.5 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] font-bold ${
                          stock.category === 'A' ? 'bg-green-100 text-green-800' :
                          stock.category === 'B' ? 'bg-blue-100 text-blue-800' :
                          stock.category === 'Z' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {stock.category}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 py-1.5 whitespace-nowrap text-right">
                        <span className="text-[11px] sm:text-xs font-bold text-gray-900 dark:text-white bg-gray-50/80 dark:bg-slate-800/80 px-1.5 sm:px-2 py-0.5 rounded-md border border-gray-100 dark:border-slate-700">
                          {stock.total_quantity.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 py-1.5 whitespace-nowrap text-right text-[11px] sm:text-xs font-medium text-gray-900 dark:text-white">
                        {stock.average_buy_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-2 sm:px-3 py-1.5 whitespace-nowrap text-right text-[11px] sm:text-xs font-medium text-gray-900 dark:text-white">
                        {stock.latest_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-2 sm:px-3 py-1.5 whitespace-nowrap text-right">
                        <span className="text-[11px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {stock.portfolio_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 py-1.5 whitespace-nowrap text-right">
                        <span className="text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-50/80 dark:bg-slate-800/80 px-1.5 sm:px-2 py-0.5 rounded-md border border-gray-100 dark:border-slate-700">
                          {globalTotalInvestment > 0 ? ((stock.total_investment / globalTotalInvestment) * 100).toFixed(2) : '0.00'}%
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 py-1.5 whitespace-nowrap text-right text-[11px] sm:text-xs font-bold text-gray-900 dark:text-white">
                        {stock.total_investment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-2 sm:px-3 py-1.5 whitespace-nowrap text-right">
                        {(() => {
                          const pl = (stock.total_quantity * stock.latest_price) - stock.total_investment;
                          const plPercent = stock.total_investment > 0 ? (pl / stock.total_investment) * 100 : 0;
                          return (
                            <div className="flex flex-col items-end">
                              <span className={`text-[11px] sm:text-xs font-bold ${pl > 0 ? 'text-green-600 dark:text-green-400' : pl < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500'}`}>
                                {pl > 0 ? '+' : ''}{pl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className={`text-[9px] sm:text-[10px] font-medium ${pl > 0 ? 'text-green-600/70 dark:text-green-400/70' : pl < 0 ? 'text-rose-600/70 dark:text-rose-400/70' : 'text-gray-400'}`}>
                                {pl > 0 ? '+' : ''}{plPercent.toFixed(2)}%
                              </span>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-2 sm:px-3 py-1.5 whitespace-nowrap text-right text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">
                        {new Date(stock.updated_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: '2-digit'
                        })}
                      </td>
                      <td className="px-2 sm:px-3 py-1.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openDetailsDrawer(stock)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedStockForCalc(stock)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-colors cursor-pointer"
                            title="Average Calculator"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3">
                        <Briefcase className="w-5 h-5 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-800 mb-1">{dict.dashboard.noHoldings}</h3>
                      <p className="text-gray-400 text-xs max-w-sm mx-auto">
                        {dict.portfolio.noShares}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          <div className="bg-gray-50/50 dark:bg-slate-900/50 px-6 py-2.5 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <div className="hidden sm:block">
              <p className="text-[13px] text-gray-500 dark:text-gray-400">
                Showing page <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalPages || 1}</span>
              </p>
            </div>
            <div className="flex-1 flex justify-between sm:justify-end gap-2">
              {currentPage > 1 ? (
                <Link 
                  href={`/portfolio?page=${currentPage - 1}`}
                  className="relative inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Link>
              ) : (
                <button disabled className="relative inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 text-[13px] font-medium text-gray-400 dark:text-gray-600 cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
              )}

              {/* Page Numbers */}
              <div className="hidden sm:flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map((page) => (
                  <Link
                    key={page}
                    href={`/portfolio?page=${page}`}
                    className={`relative inline-flex items-center justify-center w-8 h-8 rounded-lg text-[13px] font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-indigo-600 text-white shadow-sm border border-indigo-600'
                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-transparent hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {page}
                  </Link>
                ))}
              </div>

              {currentPage < (totalPages || 1) ? (
                <Link 
                  href={`/portfolio?page=${currentPage + 1}`}
                  className="relative inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              ) : (
                <button disabled className="relative inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 text-[13px] font-medium text-gray-400 dark:text-gray-600 cursor-not-allowed">
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {selectedStockForCalc && (
          <AverageDownCalculator
            stock={selectedStockForCalc}
            onClose={() => setSelectedStockForCalc(null)}
          />
        )}

        {/* Details Drawer */}
        {selectedStockDetails && (
          <>
            <div 
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 transition-opacity"
              onClick={() => setSelectedStockDetails(null)}
            />
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col transform transition-transform duration-300">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-slate-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold shadow-sm border border-indigo-100/50 dark:border-indigo-800 mr-3 text-lg">
                    {selectedStockDetails.symbol.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedStockDetails.symbol}</h2>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{selectedStockDetails.company_name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStockDetails(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center">
                  <History className="w-4 h-4 mr-2 text-indigo-500" />
                  Transaction History
                </h3>
                
                {isLoadingHistory ? (
                  <div className="space-y-4">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 animate-pulse">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded mb-2"></div>
                        <div className="h-3 w-32 bg-gray-200 dark:bg-slate-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : stockHistory.length > 0 ? (
                  <div className="space-y-3">
                    {stockHistory.map((item, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg mr-3 ${
                            item.type === 'BUY' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' :
                            item.type === 'SELL' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' :
                            'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {item.type === 'DIVIDEND' ? <Coins className="w-4 h-4" /> : <ArrowRightLeft className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${
                              item.type === 'BUY' ? 'text-indigo-600 dark:text-indigo-400' :
                              item.type === 'SELL' ? 'text-rose-600 dark:text-rose-400' :
                              'text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {item.type} {item.type !== 'DIVIDEND' && <span className="text-gray-500 dark:text-gray-400 font-medium">({item.quantity} units)</span>}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                            ৳{item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          {item.type !== 'DIVIDEND' && (
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-0.5">
                              @ ৳{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          )}
                          {item.type === 'DIVIDEND' && item.quantity > 0 && (
                            <p className="text-xs text-emerald-600 mt-0.5 font-medium">
                              +{item.quantity} Bonus Shares
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500">No transaction history found</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </motion.div>
  )
}
