'use client'

import { useState } from 'react'
import { X, Calculator, ArrowRight, Target, Wallet } from 'lucide-react'

type StockData = {
  symbol: string
  company_name: string
  total_quantity: number
  average_buy_price: number
  latest_price: number
}

type Props = {
  stock: StockData
  onClose: () => void
}

export default function AverageDownCalculator({ stock, onClose }: Props) {
  const [tab, setTab] = useState<'target' | 'budget'>('target')
  const [inputValue, setInputValue] = useState<string>('')

  const currentQty = stock.total_quantity
  const currentAvg = stock.average_buy_price
  const currentPrice = stock.latest_price

  // Calculate based on Target Average
  const calculateByTarget = () => {
    const target = parseFloat(inputValue)
    if (isNaN(target) || target <= 0) return null

    // Target must be strictly between Market Price and Current Average
    if (target <= currentPrice) {
      return { error: `Target average must be greater than current market price (৳${currentPrice.toFixed(2)}).` }
    }
    if (target >= currentAvg) {
      return { error: `Target average must be less than current average (৳${currentAvg.toFixed(2)}).` }
    }

    // Formula: Q2 = Q1 * (T - P1) / (P2 - T)
    const requiredQty = Math.ceil((currentQty * (currentAvg - target)) / (target - currentPrice))
    const requiredInvestment = requiredQty * currentPrice

    return {
      requiredQty,
      requiredInvestment,
      newTotalQty: currentQty + requiredQty,
      newAvg: target
    }
  }

  // Calculate based on Budget
  const calculateByBudget = () => {
    const budget = parseFloat(inputValue)
    if (isNaN(budget) || budget <= 0) return null

    // Qty = floor(Budget / Market Price)
    const newQty = Math.floor(budget / currentPrice)
    if (newQty === 0) {
      return { error: `Budget is too low to buy even 1 share at ৳${currentPrice.toFixed(2)}.` }
    }

    const actualInvestment = newQty * currentPrice
    const newTotalQty = currentQty + newQty
    const newAvg = ((currentQty * currentAvg) + actualInvestment) / newTotalQty

    return {
      newQty,
      actualInvestment,
      newTotalQty,
      newAvg
    }
  }

  const targetResult = tab === 'target' ? calculateByTarget() : null
  const budgetResult = tab === 'budget' ? calculateByBudget() : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl backdrop-saturate-150 border border-white/60 dark:border-slate-700/60 shadow-2xl rounded-3xl w-full max-w-md overflow-hidden flex flex-col transform transition-all">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100/50 dark:border-slate-800/50 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 transition-colors">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-colors">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white transition-colors">Average Down Calculator</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium transition-colors">{stock.symbol}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100/50 dark:bg-slate-800/50 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center text-gray-400 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Status */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 p-3 rounded-2xl text-center transition-colors">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 transition-colors">Your Shares</p>
              <p className="text-sm font-black text-gray-900 dark:text-white transition-colors">{currentQty}</p>
            </div>
            <div className="bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100/50 dark:border-rose-800/30 p-3 rounded-2xl text-center transition-colors">
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1 transition-colors">Avg Cost</p>
              <p className="text-sm font-black text-rose-600 dark:text-rose-400 transition-colors">৳{currentAvg.toFixed(2)}</p>
            </div>
            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/30 p-3 rounded-2xl text-center transition-colors">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1 transition-colors">Live Price</p>
              <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 transition-colors">৳{currentPrice.toFixed(2)}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100/50 dark:bg-slate-800/50 p-1 rounded-xl transition-colors">
            <button
              onClick={() => { setTab('target'); setInputValue(''); }}
              className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'target' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/50 dark:border-slate-600' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Target className="w-3.5 h-3.5 mr-1.5" />
              Target Average
            </button>
            <button
              onClick={() => { setTab('budget'); setInputValue(''); }}
              className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'budget' 
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm border border-gray-200/50 dark:border-slate-600' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 mr-1.5" />
              Budget Based
            </button>
          </div>

          {/* Inputs */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 transition-colors">
              {tab === 'target' ? 'Enter your target average price (৳):' : 'Enter your investment budget (৳):'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 font-bold">৳</span>
              </div>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={tab === 'target' ? (currentPrice + 1).toFixed(2) : '50000'}
                className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm font-bold rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block pl-8 pr-4 py-3 shadow-sm transition-shadow placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* Results Area */}
          <div className="min-h-[100px]">
            {inputValue && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {tab === 'target' && targetResult && (
                  <>
                    {'error' in targetResult ? (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 text-center transition-colors">
                        {targetResult.error}
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-800 border border-indigo-100/50 dark:border-indigo-800/30 p-5 rounded-2xl shadow-sm text-center transition-colors">
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-3 transition-colors">To reach your target average, you need to buy:</p>
                        <div className="flex items-center justify-center space-x-2 text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-1 transition-colors">
                          <span>{targetResult.requiredQty.toLocaleString()}</span>
                          <span className="text-sm text-indigo-400 dark:text-indigo-500">shares</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 font-bold mb-4 transition-colors">at current price ৳{currentPrice.toFixed(2)}</p>
                        
                        <div className="pt-4 border-t border-indigo-100 dark:border-indigo-800/50 flex justify-between items-center text-left transition-colors">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-indigo-400 dark:text-indigo-500 transition-colors">Total Investment</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">৳{targetResult.requiredInvestment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-indigo-300 dark:text-indigo-600 transition-colors" />
                          <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-indigo-400 dark:text-indigo-500 transition-colors">New Total Shares</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">{targetResult.newTotalQty.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {tab === 'budget' && budgetResult && (
                  <>
                    {'error' in budgetResult ? (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 text-center transition-colors">
                        {budgetResult.error}
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-800 border border-emerald-100/50 dark:border-emerald-800/30 p-5 rounded-2xl shadow-sm text-center transition-colors">
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-3 transition-colors">With this budget, you can buy:</p>
                        <div className="flex items-center justify-center space-x-2 text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-1 transition-colors">
                          <span>{budgetResult.newQty.toLocaleString()}</span>
                          <span className="text-sm text-emerald-400 dark:text-emerald-600">shares</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 font-bold mb-4 transition-colors">costing ৳{budgetResult.actualInvestment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        
                        <div className="pt-4 border-t border-emerald-100 dark:border-emerald-800/50 flex justify-between items-center text-left transition-colors">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-emerald-400 dark:text-emerald-600 transition-colors">New Average Cost</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">৳{budgetResult.newAvg.toFixed(2)}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-emerald-300 dark:text-emerald-600 transition-colors" />
                          <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-emerald-400 dark:text-emerald-600 transition-colors">New Total Shares</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">{budgetResult.newTotalQty.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {!inputValue && (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">
                Enter a value above to calculate.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
