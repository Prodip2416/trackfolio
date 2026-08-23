'use client'

import { ArrowDownRight, ArrowUpRight, Banknote } from 'lucide-react'

interface HistoryTabsProps {
  activeTab: 'BUY' | 'SELL' | 'DIVIDEND'
  onTabChange: (tab: 'BUY' | 'SELL' | 'DIVIDEND') => void
  currentTotal: number
}

export default function HistoryTabs({ activeTab, onTabChange, currentTotal }: HistoryTabsProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3 shrink-0">
      {/* Tabs Section */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onTabChange('BUY')}
          className={`flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
            activeTab === 'BUY'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>Buy History</span>
        </button>

        <button
          onClick={() => onTabChange('SELL')}
          className={`flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
            activeTab === 'SELL'
              ? 'bg-pink-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Sell History</span>
        </button>

        <button
          onClick={() => onTabChange('DIVIDEND')}
          className={`flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
            activeTab === 'DIVIDEND'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700'
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span>Dividend History</span>
        </button>
      </div>

      {/* Filter Summary */}
      <div className={`px-5 py-2.5 rounded-xl border flex flex-row items-center gap-4 shadow-sm transition-colors ${
        activeTab === 'BUY' ? 'bg-indigo-50/80 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/30' : 
        activeTab === 'SELL' ? 'bg-pink-50/80 dark:bg-pink-900/20 border-pink-100 dark:border-pink-800/30' :
        'bg-green-50/80 dark:bg-green-900/20 border-green-100 dark:border-green-800/30'
      }`}>
        <div className="flex flex-col">
          <span className={`text-[10px] font-bold tracking-wider uppercase transition-colors ${
            activeTab === 'BUY' ? 'text-indigo-600 dark:text-indigo-400' : 
            activeTab === 'SELL' ? 'text-pink-600 dark:text-pink-400' :
            'text-green-600 dark:text-green-400'
          }`}>
            Filtered {activeTab === 'BUY' ? 'Buy' : activeTab === 'SELL' ? 'Sell' : 'Cash'} Total
          </span>
          <span className={`text-lg font-extrabold leading-tight transition-colors ${
            activeTab === 'BUY' ? 'text-indigo-900 dark:text-indigo-300' : 
            activeTab === 'SELL' ? 'text-pink-900 dark:text-pink-300' :
            'text-green-900 dark:text-green-300'
          }`}>
            ৳{currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  )
}
