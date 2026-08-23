'use client'

import { Briefcase, Banknote, TrendingDown, Coins, Gift } from 'lucide-react'

interface LedgerSummaryCardsProps {
  totalShareCount: number
  totalBuyPrice: number
  totalSellPrice: number
  totalCashDividend: number
  totalBonusShare: number
  dict: any
}

export default function LedgerSummaryCards({
  totalShareCount,
  totalBuyPrice,
  totalSellPrice,
  totalCashDividend,
  totalBonusShare,
  dict
}: LedgerSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* Total Share */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute -right-2 -top-2 w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/20 group-hover:scale-110 transition-transform duration-500"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">{dict.ledger?.totalShare || 'Total Share'}</h3>
            <div className="p-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-md text-indigo-600 dark:text-indigo-400">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {totalShareCount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Total Buy Price */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute -right-2 -top-2 w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 group-hover:scale-110 transition-transform duration-500"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">{dict.ledger?.totalBuyPrice || 'Total Buy Price'}</h3>
            <div className="p-1 bg-blue-50 dark:bg-blue-900/30 rounded-md text-blue-600 dark:text-blue-400">
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            ৳ {totalBuyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Total Sell Price */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute -right-2 -top-2 w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/20 group-hover:scale-110 transition-transform duration-500"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">{dict.ledger?.totalSellPrice || 'Total Sell Price'}</h3>
            <div className="p-1 bg-rose-50 dark:bg-rose-900/30 rounded-md text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            ৳ {totalSellPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
      
      {/* Total Cash Dividend */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute -right-2 -top-2 w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 group-hover:scale-110 transition-transform duration-500"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">{dict.ledger?.totalCashDividend || 'Total Cash Dividend'}</h3>
            <div className="p-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-md text-emerald-600 dark:text-emerald-400">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            ৳ {totalCashDividend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Total Bonus Stock */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute -right-2 -top-2 w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 group-hover:scale-110 transition-transform duration-500"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">{dict.ledger?.totalBonusStock || 'Total Bonus Stock'}</h3>
            <div className="p-1 bg-amber-50 dark:bg-amber-900/30 rounded-md text-amber-600 dark:text-amber-400">
              <Gift className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {totalBonusShare.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}
