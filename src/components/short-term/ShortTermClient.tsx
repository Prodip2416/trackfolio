'use client'

import { useState } from 'react'
import { Plus, Wallet, Target, Trophy, Clock, History, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import TradeFormModal from './TradeFormModal'
import { deleteTrade } from '@/app/short-term/actions'
import ConfirmModal from '@/components/shared/ConfirmModal'
import toast from 'react-hot-toast'

export type TradeLeg = {
  id: string
  trade_id: string
  type: 'BUY' | 'SELL'
  quantity: number
  price_per_unit: number
  brokerage_fee: number
  date: Date
}

export type Trade = {
  id: string
  symbol: string
  status: 'OPEN' | 'CLOSED'
  total_buy_qty: number
  total_sell_qty: number
  average_buy_price: number
  average_sell_price: number
  realized_profit: number
  opened_at: Date
  closed_at: Date | null
  legs: TradeLeg[]
}

export default function ShortTermClient({ trades, availableSymbols }: { trades: Trade[], availableSymbols: string[] }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'OPEN' | 'CLOSED'>('OPEN')
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null)
  
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const openTrades = trades.filter(t => t.status === 'OPEN')
  const closedTrades = trades.filter(t => t.status === 'CLOSED')
  
  const totalRealizedProfit = trades.reduce((sum, t) => sum + t.realized_profit, 0)
  
  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteTrade(deleteId)
      toast.success('Trade campaign deleted')
    } catch (error) {
      toast.error('Failed to delete trade')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Trade Journal</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your short-term swing and day trades.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Trade
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{openTrades.length}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mr-4">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Trades</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{closedTrades.length}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('OPEN')}
          className={`flex items-center pb-4 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'OPEN'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <Clock className="w-4 h-4 mr-2" />
          Active Trades ({openTrades.length})
        </button>
        <button
          onClick={() => setActiveTab('CLOSED')}
          className={`flex items-center pb-4 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'CLOSED'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <History className="w-4 h-4 mr-2" />
          History ({closedTrades.length})
        </button>
      </div>

      {/* Trade List */}
      <div className="space-y-4">
        {(activeTab === 'OPEN' ? openTrades : closedTrades).map(trade => (
          <div key={trade.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            {/* Header / Summary */}
            <div 
              className="p-5 flex flex-wrap items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
              onClick={() => setExpandedTradeId(expandedTradeId === trade.id ? null : trade.id)}
            >
              <div className="flex items-center space-x-4 min-w-[200px]">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${trade.status === 'OPEN' ? 'bg-indigo-500' : 'bg-gray-400'}`}>
                  {trade.symbol.substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{trade.symbol}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Opened: {new Date(trade.opened_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-8 items-center mt-4 sm:mt-0">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Holding</p>
                  <p className="font-bold text-gray-900 dark:text-white">{trade.total_buy_qty - trade.total_sell_qty} Qty</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avg Buy Price</p>
                  <p className="font-bold text-gray-900 dark:text-white">৳{trade.average_buy_price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Realized Profit</p>
                  <p className={`font-bold ${trade.realized_profit > 0 ? 'text-emerald-600 dark:text-emerald-400' : trade.realized_profit < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
                    ৳{trade.realized_profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setDeleteId(trade.id); }}
                    className="p-2 text-gray-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedTradeId === trade.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </div>
            </div>

            {/* Expanded Legs */}
            {expandedTradeId === trade.id && (
              <div className="bg-gray-50 dark:bg-slate-800/30 p-5 border-t border-gray-100 dark:border-slate-800">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Transaction History</h4>
                <div className="space-y-3">
                  {trade.legs.map(leg => (
                    <div key={leg.id} className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-bold rounded-md ${leg.type === 'BUY' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'}`}>
                          {leg.type}
                        </span>
                        <span className="text-sm text-gray-900 dark:text-white font-medium">{leg.quantity} Qty @ ৳{leg.price_per_unit.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Fee: ৳{leg.brokerage_fee.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(leg.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {(activeTab === 'OPEN' ? openTrades : closedTrades).length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
            <Target className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No trades found in this category.</p>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <TradeFormModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          availableSymbols={availableSymbols} 
        />
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Trade Campaign"
        message="Are you sure you want to delete this entire trade campaign? This will remove all buy and sell legs associated with it. This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  )
}
