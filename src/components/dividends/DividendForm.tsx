'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { getOwnedStocks, addDividend } from '@/app/dividends/actions'
import SearchableDropdown from '@/components/shared/SearchableDropdown'
import PremiumDatePicker from '@/components/shared/PremiumDatePicker'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

type OwnedStock = {
  id: string
  symbol: string
  company_name: string
}

export default function DividendForm({ 
  onClose 
}: { 
  onClose: () => void 
}) {
  const router = useRouter()
  const [ownedStocks, setOwnedStocks] = useState<OwnedStock[]>([])
  const [isLoadingStocks, setIsLoadingStocks] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Form State
  const [symbol, setSymbol] = useState('')
  const [type, setType] = useState('FINAL') // INTERIM or FINAL
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [date, setDate] = useState('')
  const [cashAmount, setCashAmount] = useState('')
  const [bonusQuantity, setBonusQuantity] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    async function fetchStocks() {
      const result = await getOwnedStocks()
      if (result.data) {
        setOwnedStocks(result.data)
      }
      setIsLoadingStocks(false)
    }
    fetchStocks()
  }, [])

  const stockOptions = ownedStocks.map(stock => ({
    label: `${stock.symbol} - ${stock.company_name}`,
    value: stock.symbol
  }))

  const typeOptions = [
    { label: 'Final Dividend', value: 'FINAL' },
    { label: 'Interim Dividend', value: 'INTERIM' }
  ]

  const yearOptions = Array.from({ length: 51 }, (_, i) => {
    const y = (2025 + i).toString()
    return { label: y, value: y }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!symbol) {
      toast.error('Please select a stock')
      return
    }
    if (!date) {
      toast.error('Please select a declaration date')
      return
    }
    if (!cashAmount && !bonusQuantity) {
      toast.error('Please enter either cash amount or bonus quantity')
      return
    }

    if (cashAmount && Number(cashAmount) <= 0) {
      toast.error('Cash Amount must be greater than 0')
      return
    }

    if (bonusQuantity && Number(bonusQuantity) <= 0) {
      toast.error('Bonus Quantity must be greater than 0')
      return
    }

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append('symbol', symbol)
    formData.append('type', type)
    formData.append('year', year)
    formData.append('date', date)
    if (cashAmount) formData.append('cash_amount', cashAmount)
    if (bonusQuantity) formData.append('bonus_quantity', bonusQuantity)
    if (note) formData.append('note', note)

    const res = await addDividend(formData)
    
    setIsSubmitting(false)
    
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Dividend saved successfully!')
      router.refresh()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto pt-20 pb-10">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md relative flex flex-col max-h-full">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-6 pb-2 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Log Dividend
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Track your cash and bonus dividends.
          </p>
        </div>

        <div className="px-6 pb-6 overflow-y-auto custom-scrollbar flex-grow">
          {isLoadingStocks ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : ownedStocks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">You don't own any stocks yet.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Add a buy transaction first to log dividends.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              
              {/* Stock Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Owned Stock
                </label>
                <SearchableDropdown
                  options={stockOptions}
                  value={symbol}
                  onChange={setSymbol}
                  placeholder="Search your portfolio..."
                  buttonClassName="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium min-h-[46px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <SearchableDropdown
                    options={typeOptions}
                    value={type}
                    onChange={setType}
                    buttonClassName="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium min-h-[46px]"
                  />
                </div>
                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Year
                  </label>
                  <SearchableDropdown
                    options={yearOptions}
                    value={year}
                    onChange={setYear}
                    buttonClassName="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium min-h-[46px]"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Declaration Date
                </label>
                <PremiumDatePicker
                  value={date}
                  onChange={setDate}
                  placeholder="Select declaration date"
                  buttonClassName="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium min-h-[46px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Cash Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cash Amount (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white"
                    placeholder="e.g. 500"
                  />
                </div>

                {/* Bonus Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bonus Shares
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={bonusQuantity}
                    onChange={(e) => setBonusQuantity(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white"
                    placeholder="e.g. 50"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Note (Optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white resize-none"
                  placeholder="Any notes regarding this dividend..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 text-white font-medium py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Dividend</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
