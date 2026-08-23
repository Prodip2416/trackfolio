'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { savePriceAlert } from '@/app/watchlist/actions'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import SearchableDropdown from '@/components/shared/SearchableDropdown'

type PriceAlert = {
  id: string
  symbol: string
  company_name: string
  sector: string
  current_price: number | null
  buy_min_price: number | null
  buy_max_price: number | null
  sell_min_price: number | null
  sell_max_price: number | null
  is_buy_triggered: boolean
  is_sell_triggered: boolean
  buy_status: 'in_range' | 'below_range' | 'above_range' | 'none'
  sell_status: 'in_range' | 'below_range' | 'above_range' | 'none'
  created_at: string
}

type WatchlistSymbol = {
  symbol: string
  company_name: string
  current_price: number | null
}

interface PriceAlertFormModalProps {
  isOpen: boolean
  onClose: () => void
  editingAlert: PriceAlert | null
  watchlistSymbols: WatchlistSymbol[]
}

export default function PriceAlertFormModal({ 
  isOpen, 
  onClose, 
  editingAlert, 
  watchlistSymbols 
}: PriceAlertFormModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [symbol, setSymbol] = useState('')
  const [buyMin, setBuyMin] = useState('')
  const [buyMax, setBuyMax] = useState('')
  const [sellMin, setSellMin] = useState('')
  const [sellMax, setSellMax] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (editingAlert) {
        setSymbol(editingAlert.symbol)
        setBuyMin(editingAlert.buy_min_price?.toString() || '')
        setBuyMax(editingAlert.buy_max_price?.toString() || '')
        setSellMin(editingAlert.sell_min_price?.toString() || '')
        setSellMax(editingAlert.sell_max_price?.toString() || '')
      } else {
        setSymbol('')
        setBuyMin('')
        setBuyMax('')
        setSellMin('')
        setSellMax('')
      }
    }
  }, [isOpen, editingAlert])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('symbol', symbol)
    if (buyMin) formData.append('buy_min_price', buyMin)
    if (buyMax) formData.append('buy_max_price', buyMax)
    if (sellMin) formData.append('sell_min_price', sellMin)
    if (sellMax) formData.append('sell_max_price', sellMax)

    const result = await savePriceAlert(formData)
    setIsSubmitting(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(editingAlert ? 'Price alert updated!' : 'Price alert created!')
      onClose()
      router.refresh()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto pt-20 pb-10">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md relative flex flex-col max-h-full">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="px-6 pt-6 pb-2 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {editingAlert ? 'Edit Price Alert' : 'New Price Alert'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Set buy and sell price ranges for this stock.
          </p>
        </div>

        <div className="px-6 pb-6 overflow-y-auto custom-scrollbar flex-grow">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Stock Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Stock
              </label>
              {editingAlert ? (
                <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
                  <div>
                    <div className="font-semibold text-indigo-900 dark:text-indigo-100">{editingAlert.symbol}</div>
                    <div className="text-sm text-indigo-700 dark:text-indigo-300 truncate max-w-[200px]">{editingAlert.company_name}</div>
                  </div>
                </div>
              ) : (
                <SearchableDropdown
                  options={watchlistSymbols.map(s => ({
                    label: `${s.symbol} - ${s.company_name}`,
                    value: s.symbol
                  }))}
                  value={symbol}
                  onChange={(val) => setSymbol(val)}
                  placeholder="Select a stock..."
                  searchPlaceholder="Search stock..."
                  buttonClassName="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white text-gray-900"
                />
              )}
            </div>

            {/* Buy Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="inline-flex items-center">
                  <TrendingDown className="w-4 h-4 mr-1 text-green-600 dark:text-green-400" />
                  Buy Price Range
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Min Price (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={buyMin}
                    onChange={(e) => setBuyMin(e.target.value)}
                    placeholder="e.g. 20"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder-gray-400 placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Max Price (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={buyMax}
                    onChange={(e) => setBuyMax(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder-gray-400 placeholder-gray-400"
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                Alert when price is between min and max (e.g., 20-25 tk)
              </p>
            </div>

            {/* Sell Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="inline-flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1 text-red-600 dark:text-red-400" />
                  Sell Price Range
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Min Price (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sellMin}
                    onChange={(e) => setSellMin(e.target.value)}
                    placeholder="e.g. 300"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder-gray-400 placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Max Price (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sellMax}
                    onChange={(e) => setSellMax(e.target.value)}
                    placeholder="e.g. 320"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder-gray-400 placeholder-gray-400"
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                Alert when price is between min and max (e.g., 300-320 tk)
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 text-white font-medium py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingAlert ? 'Update Alert' : 'Save Alert'}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
