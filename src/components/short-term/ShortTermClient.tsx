'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Plus, Target, Clock, History, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Trash2, Loader2 } from 'lucide-react'
import TradeFormModal from './TradeFormModal'
import ShortTermFilters from './ShortTermFilters'
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

export default function ShortTermClient({
  trades,
  availableSymbols,
  filterSymbols,
  initialSymbol,
  initialYear
}: {
  trades: Trade[]
  availableSymbols: string[]
  filterSymbols: string[]
  initialSymbol: string
  initialYear: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isFilterPending, startTransition] = useTransition()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'OPEN' | 'CLOSED'>('OPEN')
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const ITEMS_PER_PAGE = 5

  const openTrades = trades.filter(t => t.status === 'OPEN')
  const closedTrades = trades.filter(t => t.status === 'CLOSED')
  const currentList = activeTab === 'OPEN' ? openTrades : closedTrades
  const totalPages = Math.max(1, Math.ceil(currentList.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedTrades = currentList.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const handleTabChange = (tab: 'OPEN' | 'CLOSED') => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'ALL') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Trade Journal</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your short-term swing and day trades.</p>
        </div>
        <div className="flex items-center gap-3">
          <ShortTermFilters
            symbols={filterSymbols}
            initialSymbol={initialSymbol}
            initialYear={initialYear}
            handleFilterChange={handleFilterChange}
          />
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Trade
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800">
        <button
          onClick={() => handleTabChange('OPEN')}
          className={`flex items-center pb-4 px-4 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'OPEN'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <Clock className="w-4 h-4 mr-2" />
          Active Trades ({openTrades.length})
        </button>
        <button
          onClick={() => handleTabChange('CLOSED')}
          className={`flex items-center pb-4 px-4 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
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
      <div className="relative min-h-[120px]">
        {isFilterPending && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-30 flex items-center justify-center rounded-2xl">
            <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
          </div>
        )}
        <div className="space-y-4 max-h-[560px] overflow-y-auto custom-scrollbar pr-1">
        {paginatedTrades.map(trade => (
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
                    className="p-2 text-gray-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
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

        {currentList.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
            <Target className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No trades found in this category.</p>
          </div>
        )}
        </div>
      </div>

      {/* Pagination */}
      {currentList.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-[13px] text-gray-500 dark:text-gray-400 hidden sm:block">
            Showing page <span className="font-semibold text-gray-900 dark:text-white">{safePage}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
          </p>
          <div className="flex-1 flex justify-between sm:justify-end gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="relative inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>

            <div className="hidden sm:flex items-center gap-1 mx-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`relative inline-flex items-center justify-center min-w-[32px] h-8 px-1 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                    page === safePage
                      ? 'bg-indigo-600 text-white shadow-sm border border-indigo-600'
                      : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-transparent hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="relative inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}

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
