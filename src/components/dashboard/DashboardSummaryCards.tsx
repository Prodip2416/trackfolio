'use client'

import { Wallet, PieChart as PieChartIcon, TrendingUp, Banknote, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'
import AnimatedCounter from '@/components/ui/AnimatedCounter'

interface DashboardSummaryCardsProps {
  kpis: {
    totalInvested: number
    totalDividend: number
    totalShares: number
    totalProfitLoss: number
    realizedPL: number
    currentPortfolioValue: number
    totalSellAmount: number
  }
  dict: any
}

export default function DashboardSummaryCards({ kpis, dict }: DashboardSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {/* Total Invested */}
      <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }} className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-900 p-4 rounded-xl border border-indigo-100/50 dark:border-indigo-800/30 shadow-md shadow-indigo-100/20 dark:shadow-none flex flex-col justify-between cursor-pointer">
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-[10px] font-semibold text-indigo-600/70 dark:text-indigo-400 uppercase tracking-wider mb-0.5">{dict.dashboard.totalInvested}</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              <AnimatedCounter value={kpis.totalInvested} prefix="৳" decimals={2} />
            </h2>
          </div>
          <div className="p-2 bg-indigo-100/50 dark:bg-indigo-900/50 rounded-lg backdrop-blur-sm">
            <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-2xl"></div>
      </motion.div>
      
      {/* Total Sell Amount */}
      <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }} className="relative overflow-hidden bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/20 dark:to-gray-900 p-4 rounded-xl border border-rose-100/50 dark:border-rose-800/30 shadow-md shadow-rose-100/20 dark:shadow-none flex flex-col justify-between cursor-pointer">
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-[10px] font-semibold text-rose-600/70 dark:text-rose-400 uppercase tracking-wider mb-0.5">{dict.dashboard.totalSellAmount}</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              <AnimatedCounter value={kpis.totalSellAmount} prefix="৳" decimals={2} />
            </h2>
          </div>
          <div className="p-2 bg-rose-100/50 dark:bg-rose-900/50 rounded-lg backdrop-blur-sm">
            <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-rose-400/10 dark:bg-rose-600/10 rounded-full blur-2xl"></div>
      </motion.div>
      
      {/* Total Dividend */}
      <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }} className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-900 p-4 rounded-xl border border-emerald-100/50 dark:border-emerald-800/30 shadow-md shadow-emerald-100/20 dark:shadow-none flex flex-col justify-between cursor-pointer">
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-[10px] font-semibold text-emerald-600/70 dark:text-emerald-400 uppercase tracking-wider mb-0.5">{dict.dashboard.totalDividend}</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              <AnimatedCounter value={kpis.totalDividend} prefix="৳" decimals={2} />
            </h2>
          </div>
          <div className="p-2 bg-emerald-100/50 dark:bg-emerald-900/50 rounded-lg backdrop-blur-sm">
            <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-400/10 dark:bg-emerald-600/10 rounded-full blur-2xl"></div>
      </motion.div>
      
      {/* Total Shares */}
      <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }} className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-900 p-4 rounded-xl border border-amber-100/50 dark:border-amber-800/30 shadow-md shadow-amber-100/20 dark:shadow-none flex flex-col justify-between cursor-pointer">
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-[10px] font-semibold text-amber-600/70 dark:text-amber-400 uppercase tracking-wider mb-0.5">{dict.dashboard.totalShares}</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              <AnimatedCounter value={kpis.totalShares} decimals={0} />
            </h2>
          </div>
          <div className="p-2 bg-amber-100/50 dark:bg-amber-900/50 rounded-lg backdrop-blur-sm">
            <PieChartIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-400/10 dark:bg-amber-600/10 rounded-full blur-2xl"></div>
      </motion.div>
      
      {/* Unrealized Profit/Loss */}
      <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }} className={`relative overflow-hidden bg-gradient-to-br p-4 rounded-xl border shadow-md flex flex-col justify-between cursor-pointer ${kpis.totalProfitLoss > 0 ? 'from-green-50 to-white dark:from-green-900/20 dark:to-gray-900 border-green-100/50 dark:border-green-800/30 shadow-green-100/20 dark:shadow-none' : kpis.totalProfitLoss < 0 ? 'from-rose-50 to-white dark:from-rose-900/20 dark:to-gray-900 border-rose-100/50 dark:border-rose-800/30 shadow-rose-100/20 dark:shadow-none' : 'from-gray-50 to-white dark:from-gray-900/20 dark:to-gray-900 border-gray-100/50 dark:border-gray-800/30 shadow-gray-100/20 dark:shadow-none'}`}>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${kpis.totalProfitLoss > 0 ? 'text-green-600/70 dark:text-green-400' : kpis.totalProfitLoss < 0 ? 'text-rose-600/70 dark:text-rose-400' : 'text-gray-500'}`}>{dict.dashboard.unrealizedPL}</p>
            <h2 className={`text-xl font-bold ${kpis.totalProfitLoss > 0 ? 'text-green-600 dark:text-green-400' : kpis.totalProfitLoss < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
              <AnimatedCounter value={kpis.totalProfitLoss} prefix={kpis.totalProfitLoss > 0 ? '+৳' : '৳'} decimals={2} />
            </h2>
          </div>
          <div className={`p-2 rounded-lg backdrop-blur-sm ${kpis.totalProfitLoss > 0 ? 'bg-green-100/50 dark:bg-green-900/50' : kpis.totalProfitLoss < 0 ? 'bg-rose-100/50 dark:bg-rose-900/50' : 'bg-gray-100/50 dark:bg-gray-800/50'}`}>
            <TrendingUp className={`w-4 h-4 ${kpis.totalProfitLoss > 0 ? 'text-green-600 dark:text-green-400' : kpis.totalProfitLoss < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400'}`} />
          </div>
        </div>
        <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl ${kpis.totalProfitLoss > 0 ? 'bg-green-400/10 dark:bg-green-600/10' : kpis.totalProfitLoss < 0 ? 'bg-rose-400/10 dark:bg-rose-600/10' : 'bg-gray-400/10 dark:bg-gray-600/10'}`}></div>
      </motion.div>
      
      {/* Realized Profit/Loss */}
      <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }} className={`relative overflow-hidden bg-gradient-to-br p-4 rounded-xl border shadow-md flex flex-col justify-between cursor-pointer ${kpis.realizedPL >= 0 ? 'from-cyan-50 to-white dark:from-cyan-900/20 dark:to-gray-900 border-cyan-100/50 dark:border-cyan-800/30 shadow-cyan-100/20 dark:shadow-none' : 'from-rose-50 to-white dark:from-rose-900/20 dark:to-gray-900 border-rose-100/50 dark:border-rose-800/30 shadow-rose-100/20 dark:shadow-none'}`}>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${kpis.realizedPL >= 0 ? 'text-cyan-600/70 dark:text-cyan-400' : 'text-rose-600/70 dark:text-rose-400'}`}>Realized P/L</p>
            <h2 className={`text-xl font-bold ${kpis.realizedPL >= 0 ? 'text-gray-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
              <AnimatedCounter value={kpis.realizedPL} prefix={kpis.realizedPL > 0 ? '+৳' : '৳'} decimals={2} />
            </h2>
          </div>
          <div className={`p-2 rounded-lg backdrop-blur-sm ${kpis.realizedPL >= 0 ? 'bg-cyan-100/50 dark:bg-cyan-900/50' : 'bg-rose-100/50 dark:bg-rose-900/50'}`}>
            <Banknote className={`w-4 h-4 ${kpis.realizedPL >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-600 dark:text-rose-400'}`} />
          </div>
        </div>
        <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl ${kpis.realizedPL >= 0 ? 'bg-cyan-400/10 dark:bg-cyan-600/10' : 'bg-rose-400/10 dark:bg-rose-600/10'}`}></div>
      </motion.div>
    </div>
  )
}
