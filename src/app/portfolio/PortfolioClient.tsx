'use client'

import { useMemo, useState } from 'react'
import { Briefcase, TrendingUp, ChevronLeft, ChevronRight, Calculator } from 'lucide-react'
import Link from 'next/link'
import AverageDownCalculator from './AverageDownCalculator'

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

export default function PortfolioClient({ 
  stocks,
  currentPage,
  totalPages,
  globalTotalInvestment,
  globalActiveStocksCount,
  dict
}: { 
  stocks: StockHolding[]
  currentPage: number
  totalPages: number
  globalTotalInvestment: number
  globalActiveStocksCount: number
  dict: any
}) {
  const [selectedStockForCalc, setSelectedStockForCalc] = useState<StockHolding | null>(null)

  return (
    <div className="w-full">
      <div className="px-4 sm:px-0">
        

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Total Investment Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 shadow-lg shadow-indigo-200 text-white relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-5%] w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 bg-indigo-400/20 rounded-full blur-xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col">
              <span className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1 flex items-center">
                <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                {dict.dashboard.totalInvested}
              </span>
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                ৳{globalTotalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Active Holdings Card */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-center transition-colors">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
              {dict.portfolio.portfolioHoldings}
            </span>
            <div className="flex items-end">
              <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-none">
                {globalActiveStocksCount}
              </span>
              <span className="text-sm font-semibold text-gray-400 ml-2 mb-1">
                Unique Stocks
              </span>
            </div>
          </div>
        </div>

        {/* Premium Data Table */}
        <div className="bg-white dark:bg-slate-900 shadow-xl shadow-gray-200/50 dark:shadow-none rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800">
              <thead className="bg-gray-100/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict.dashboard.symbol}</th>
                  <th scope="col" className="px-4 py-2.5 text-center text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">Cat</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict.dashboard.shares}</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict.portfolio.avgCost}</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict.portfolio.marketPrice}</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict.portfolio.currentValue}</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict.dashboard.totalInvested}</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict.dashboard.date}</th>
                  <th scope="col" className="px-4 py-2.5 text-center text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict.portfolio.avgDown}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                {stocks.length > 0 ? (
                  stocks.map((stock) => (
                    <tr key={stock.id} className="even:bg-gray-50/60 dark:even:bg-slate-800/40 odd:bg-white dark:odd:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-slate-800 transition-colors duration-200 group">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-slate-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold shadow-sm border border-indigo-100/50 dark:border-indigo-800 mr-3 text-xs">
                            {stock.symbol.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{stock.symbol}</div>
                            <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500">{stock.company_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          stock.category === 'A' ? 'bg-green-100 text-green-800' :
                          stock.category === 'B' ? 'bg-blue-100 text-blue-800' :
                          stock.category === 'Z' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {stock.category}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        <span className="text-xs font-bold text-gray-900 dark:text-white bg-gray-50/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-gray-100 dark:border-slate-700">
                          {stock.total_quantity.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-xs font-medium text-gray-900 dark:text-white">
                        {stock.average_buy_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-xs font-medium text-gray-900 dark:text-white">
                        {stock.latest_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {stock.portfolio_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-xs font-bold text-gray-900 dark:text-white">
                        {stock.total_investment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                        {new Date(stock.updated_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-center">
                        {stock.portfolio_price < stock.total_investment && (
                          <button
                            onClick={() => setSelectedStockForCalc(stock)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                            title="Average Down Calculator"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
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
          <div className="bg-gray-50/50 dark:bg-slate-900/50 px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
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
        </div>

        {selectedStockForCalc && (
          <AverageDownCalculator
            stock={selectedStockForCalc}
            onClose={() => setSelectedStockForCalc(null)}
          />
        )}

      </div>
    </div>
  )
}
