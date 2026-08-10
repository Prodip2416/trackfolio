'use client'

import { useMemo } from 'react'
import { Briefcase, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

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
  globalActiveStocksCount
}: { 
  stocks: StockHolding[]
  currentPage: number
  totalPages: number
  globalTotalInvestment: number
  globalActiveStocksCount: number
}) {

  return (
    <div className="w-full">
      <div className="px-4 sm:px-0">
        
        {/* Premium Summary Card */}
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 p-6 shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white opacity-5 blur-3xl transform translate-x-10 -translate-y-10"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-purple-500 opacity-10 blur-3xl transform -translate-x-10 translate-y-10"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-indigo-200 mb-1">
                <Briefcase className="w-4 h-4" />
                <span className="font-semibold tracking-wide uppercase text-xs">Total Portfolio Investment</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                ৳{globalTotalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center space-x-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
              <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-indigo-200 font-semibold">Active Stocks</p>
                <p className="text-lg font-bold text-white leading-tight">{globalActiveStocksCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Data Table */}
        <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/80">
                <tr>
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Symbol</th>
                  <th scope="col" className="px-4 py-2.5 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cat</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Shares</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Avg Buy Price (৳)</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Latest Price (৳)</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Portfolio Cost (৳)</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Invested (৳)</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Last Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {stocks.length > 0 ? (
                  stocks.map((stock) => (
                    <tr key={stock.id} className="hover:bg-indigo-50/30 transition-colors duration-200 group">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center text-indigo-700 font-bold shadow-sm border border-indigo-100/50 mr-3 text-xs">
                            {stock.symbol.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{stock.symbol}</div>
                            <div className="text-[10px] font-medium text-gray-400">{stock.company_name}</div>
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
                        <span className="text-xs font-bold text-gray-900 bg-gray-50/80 px-2 py-0.5 rounded-md border border-gray-100">
                          {stock.total_quantity.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-xs font-medium text-gray-900">
                        {stock.average_buy_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-xs font-medium text-gray-900">
                        {stock.latest_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        <span className="text-xs font-bold text-indigo-600">
                          {stock.portfolio_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-xs font-bold text-gray-900">
                        {stock.total_investment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-xs font-medium text-gray-500">
                        {new Date(stock.updated_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3">
                        <Briefcase className="w-5 h-5 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-800 mb-1">No Active Holdings</h3>
                      <p className="text-gray-400 text-xs max-w-sm mx-auto">
                        Your portfolio is empty.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="hidden sm:block">
              <p className="text-[13px] text-gray-500">
                Showing page <span className="font-semibold text-gray-900">{currentPage}</span> of <span className="font-semibold text-gray-900">{totalPages || 1}</span>
              </p>
            </div>
            <div className="flex-1 flex justify-between sm:justify-end gap-2">
              {currentPage > 1 ? (
                <Link 
                  href={`/portfolio?page=${currentPage - 1}`}
                  className="relative inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Link>
              ) : (
                <button disabled className="relative inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50 text-[13px] font-medium text-gray-400 cursor-not-allowed">
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
                        : 'bg-white text-gray-600 border border-transparent hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </Link>
                ))}
              </div>

              {currentPage < (totalPages || 1) ? (
                <Link 
                  href={`/portfolio?page=${currentPage + 1}`}
                  className="relative inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              ) : (
                <button disabled className="relative inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50 text-[13px] font-medium text-gray-400 cursor-not-allowed">
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
