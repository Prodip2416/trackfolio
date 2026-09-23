'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import SearchableDropdown from '@/components/shared/SearchableDropdown'
import PremiumDatePicker from '@/components/shared/PremiumDatePicker'
import { addTradeLeg } from '@/app/short-term/actions'
import toast from 'react-hot-toast'

interface Props {
  isOpen: boolean
  onClose: () => void
  availableSymbols: string[]
}

export default function TradeFormModal({ isOpen, onClose, availableSymbols }: Props) {
  const [symbol, setSymbol] = useState('')
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [fee, setFee] = useState('')
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const symbolOptions = availableSymbols.map(sym => ({ label: sym, value: sym }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!symbol) return toast.error('Please select a stock symbol')
    if (!quantity || Number(quantity) <= 0) return toast.error('Please enter a valid quantity')
    if (!price || Number(price) <= 0) return toast.error('Please enter a valid price')
    
    // Fee can be 0, but not negative
    const numFee = fee === '' ? 0 : Number(fee)
    if (numFee < 0) return toast.error('Fee cannot be negative')

    setIsSubmitting(true)
    try {
      await addTradeLeg({
        symbol,
        type,
        quantity: Number(quantity),
        price: Number(price),
        fee: numFee,
        date: new Date(date)
      })
      toast.success(`Trade leg added successfully!`)
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add trade leg')
    } finally {
      setIsSubmitting(false)
    }
  }

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
            Log Short Term Trade
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Add a new buy or sell entry for your trading journal.
          </p>
        </div>

        <div className="px-6 pb-6 overflow-y-auto custom-scrollbar flex-grow">
          <form onSubmit={handleSubmit} noValidate className="space-y-5 mt-4">
            
            {/* Symbol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock Symbol
              </label>
              <SearchableDropdown
                options={symbolOptions}
                value={symbol}
                onChange={setSymbol}
                placeholder="Search stock..."
                searchPlaceholder="Search DSE stocks..."
                buttonClassName="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium min-h-[46px] w-full text-left dark:text-white"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Transaction Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('BUY')}
                  className={`py-3 rounded-xl font-bold text-sm transition-colors border cursor-pointer ${
                    type === 'BUY'
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setType('SELL')}
                  className={`py-3 rounded-xl font-bold text-sm transition-colors border cursor-pointer ${
                    type === 'SELL'
                      ? 'bg-rose-500 border-rose-500 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  SELL
                </button>
              </div>
            </div>

            {/* Price and Qty */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price Per Unit (৳)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder-gray-400"
                  placeholder="e.g. 52.50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder-gray-400"
                  placeholder="e.g. 100"
                  required
                />
              </div>
            </div>

            {/* Fee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
                <span>Total Fee (Brokerage + Misc) ৳</span>
                <span className="text-xs text-gray-400 font-normal">Optional</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder-gray-400"
                placeholder="e.g. 50"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Transaction Date
              </label>
              <PremiumDatePicker
                value={date}
                onChange={setDate}
                className="w-full"
                buttonClassName="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-left focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all dark:text-white min-h-[46px]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Log Trade'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
