'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, X } from 'lucide-react'
import { getDSECompanies, addSmartTransaction, updateSmartTransaction } from '@/app/transactions/actions'
import { useRouter } from 'next/navigation'

type DSECompany = {
  symbol: string
  company_name: string
  sector: string
}

type InitialData = {
  id: string
  symbol: string
  company_name: string
  type: 'BUY' | 'SELL'
  quantity: number
  price_per_unit: number
  transaction_date: string
  brokerage_fee: number
}

export default function SmartTransactionForm({ 
  onClose, 
  initialData 
}: { 
  onClose: () => void,
  initialData?: InitialData
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DSECompany[]>([])
  
  // If editing, pre-fill selected company
  const [selectedCompany, setSelectedCompany] = useState<DSECompany | null>(
    initialData ? {
      symbol: initialData.symbol,
      company_name: initialData.company_name,
      sector: ''
    } : null
  )
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState<'BUY' | 'SELL'>(initialData?.type || 'BUY')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounced Search
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!query.trim()) {
        setResults([])
        return
      }
      setIsSearching(true)
      const data = await getDSECompanies(query)
      setResults(data || [])
      setIsSearching(false)
    }

    const timer = setTimeout(() => {
      fetchCompanies()
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setResults([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedCompany) {
      setError('Please select a company from the list first.')
      return
    }

    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    formData.append('symbol', selectedCompany.symbol)
    formData.append('company_name', selectedCompany.company_name)
    formData.append('sector', selectedCompany.sector || '')
    
    if (!formData.get('transaction_date')) {
      formData.set('transaction_date', new Date().toISOString().split('T')[0])
    }

    let result
    if (initialData) {
      result = await updateSmartTransaction(initialData.id, null, formData)
    } else {
      result = await addSmartTransaction(null, formData)
    }
    
    setIsLoading(false)

    if (result?.error) {
      setError(result.error)
    } else {
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
        
        <div className="p-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {initialData ? 'Edit Trade' : 'New Trade'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            {initialData ? 'Update your transaction details.' : 'Log a new buy or sell transaction.'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 overflow-y-auto custom-scrollbar flex-grow">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <div className="flex space-x-4">
                <label className={`flex-1 flex items-center justify-center px-4 py-3 border rounded-xl cursor-pointer transition-all ${
                  type === 'BUY' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-900/30 dark:border-indigo-500 dark:text-indigo-300' 
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}>
                  <input 
                    type="radio" 
                    name="type" 
                    value="BUY" 
                    checked={type === 'BUY'}
                    onChange={() => setType('BUY')}
                    className="hidden" 
                  />
                  Buy
                </label>
                <label className={`flex-1 flex items-center justify-center px-4 py-3 border rounded-xl cursor-pointer transition-all ${
                  type === 'SELL' 
                    ? 'border-red-600 bg-red-50 text-red-700 font-semibold dark:bg-red-900/30 dark:border-red-500 dark:text-red-300' 
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}>
                  <input 
                    type="radio" 
                    name="type" 
                    value="SELL" 
                    checked={type === 'SELL'}
                    onChange={() => setType('SELL')}
                    className="hidden" 
                  />
                  Sell
                </label>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Stock
              </label>
              
              {!selectedCompany ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search company (e.g. GP)"
                      disabled={!!initialData}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white placeholder-gray-400 disabled:opacity-50"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                    )}
                  </div>

                  {/* Dropdown Results */}
                  {results.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
                      {results.map((company) => (
                        <div
                          key={company.symbol}
                          onClick={() => {
                            setSelectedCompany(company)
                            setQuery('')
                            setResults([])
                          }}
                          className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-100 dark:border-gray-700/50 last:border-0 transition-colors"
                        >
                          <div className="font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                            <span>{company.symbol}</span>
                            <span className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">
                              {company.sector || 'N/A'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {company.company_name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
                  <div>
                    <div className="font-semibold text-indigo-900 dark:text-indigo-100">{selectedCompany.symbol}</div>
                    <div className="text-sm text-indigo-700 dark:text-indigo-300 truncate max-w-[200px]">{selectedCompany.company_name}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCompany(null)}
                    disabled={!!initialData}
                    className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  required
                  min="1"
                  step="0.01"
                  defaultValue={initialData?.quantity}
                  placeholder="e.g. 100"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white"
                />
              </div>

              {/* Price Per Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price (৳)
                </label>
                <input
                  type="number"
                  name="price_per_unit"
                  required
                  min="0.1"
                  step="0.1"
                  defaultValue={initialData?.price_per_unit}
                  placeholder="e.g. 45.5"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="transaction_date"
                  required
                  defaultValue={initialData ? initialData.transaction_date.split('T')[0] : new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white"
                />
              </div>

              {/* Brokerage Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fee (৳)
                </label>
                <input
                  type="number"
                  name="brokerage_fee"
                  min="0"
                  step="0.01"
                  defaultValue={initialData?.brokerage_fee || ''}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !selectedCompany}
              className={`w-full mt-2 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 ${
                type === 'BUY' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-red-600 hover:bg-red-700'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{initialData ? 'Update Trade' : `Save ${type === 'BUY' ? 'Purchase' : 'Sale'}`}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
