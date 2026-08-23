'use client'

import { Loader2, Search, ArrowUpRight, ArrowDownRight, Coins } from 'lucide-react'

type LedgerRow = {
  id: string
  date: string
  type: string
  symbol: string
  company_name: string
  quantity: number
  price_per_unit: number | null
  total: number
}

interface LedgerTableProps {
  data: LedgerRow[]
  isPending: boolean
  isLoading: boolean
  dict: any
}

export default function LedgerTable({ data, isPending, isLoading, dict }: LedgerTableProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BUY':
        return <ArrowDownRight className="w-4 h-4 text-emerald-500" />
      case 'SELL':
        return <ArrowUpRight className="w-4 h-4 text-rose-500" />
      case 'DIVIDEND':
        return <Coins className="w-4 h-4 text-indigo-500" />
      default:
        return null
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'BUY':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            {dict.dashboard?.buy || 'BUY'}
          </span>
        )
      case 'SELL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
            {dict.dashboard?.sell || 'SELL'}
          </span>
        )
      case 'DIVIDEND':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
            {dict.sidebar?.dividendReport ? 'DIVIDEND' : 'DIVIDEND'}
          </span>
        )
      default:
        return <span>{type}</span>
    }
  }

  return (
    <div className="flex-1 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-colors duration-200 relative flex flex-col min-h-0">
      {(isPending || isLoading) && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-30 flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      )}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full text-xs text-left">
          <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-200/50 dark:border-slate-800 sticky top-0 z-20 backdrop-blur-md">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Date</th>
              <th className="px-4 py-2.5 font-semibold">Type</th>
              <th className="px-4 py-2.5 font-semibold">Stock</th>
              <th className="px-4 py-2.5 font-semibold text-right">Quantity</th>
              <th className="px-4 py-2.5 font-semibold text-right">Price / Unit</th>
              <th className="px-4 py-2.5 font-semibold text-right">Total (৳)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50 dark:divide-slate-800/50">
            {data.map((row) => (
              <tr key={`${row.type}-${row.id}`} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300">
                  {new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(row.date))}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(row.type)}
                    {getTypeBadge(row.type)}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                  {row.symbol}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-gray-900 dark:text-white">
                  {row.quantity > 0 ? row.quantity.toLocaleString() : '-'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-gray-600 dark:text-gray-300">
                  {row.price_per_unit ? `৳ ${row.price_per_unit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right font-medium text-gray-900 dark:text-white">
                  {row.total > 0 ? `৳ ${row.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                </td>
              </tr>
            ))}
            
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    <p className="text-base font-medium text-gray-900 dark:text-gray-200">No transactions found</p>
                    <p className="text-sm">Try adjusting your filters or adding new transactions.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
