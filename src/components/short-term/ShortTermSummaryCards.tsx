import { Wallet, Target, Trophy, Receipt } from 'lucide-react'

export default function ShortTermSummaryCards({
  totalRealizedProfit,
  openTradesCount,
  closedTradesCount,
  totalFees,
}: {
  totalRealizedProfit: number
  openTradesCount: number
  closedTradesCount: number
  totalFees: number
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mr-4">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Realized Profit</p>
          <h3 className={`text-2xl font-black ${totalRealizedProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            ৳{totalRealizedProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </h3>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center">
        <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mr-4">
          <Target className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Open Trades</p>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">{openTradesCount}</h3>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mr-4">
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Trades</p>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">{closedTradesCount}</h3>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mr-4">
          <Receipt className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Fees Paid</p>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">
            ৳{totalFees.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </h3>
        </div>
      </div>
    </div>
  )
}
