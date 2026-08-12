'use client'

import { useState, useMemo } from 'react'
import { FileText, Printer, Briefcase, TrendingUp, TrendingDown, Coins, Calculator } from 'lucide-react'

type DividendItem = {
  symbol: string
  date: string
  amount: number
}

type CapitalGainItem = {
  id: string
  symbol: string
  date: string
  qtySold: number
  sellValue: number
  costValue: number
  realizedGain: number
}

type Props = {
  availableYears: string[]
  dividendsByFY: Record<string, DividendItem[]>
  capitalGainsByFY: Record<string, CapitalGainItem[]>
}

export default function TaxReportClient({ availableYears, dividendsByFY, capitalGainsByFY }: Props) {
  const [selectedFY, setSelectedFY] = useState<string>(availableYears[0])

  // Get data for selected Financial Year
  const dividends = useMemo(() => dividendsByFY[selectedFY] || [], [dividendsByFY, selectedFY])
  const capitalGains = useMemo(() => capitalGainsByFY[selectedFY] || [], [capitalGainsByFY, selectedFY])

  // Calculate KPIs
  const totalDividend = useMemo(() => dividends.reduce((sum, d) => sum + d.amount, 0), [dividends])
  const totalCapitalGain = useMemo(() => capitalGains.reduce((sum, g) => sum + g.realizedGain, 0), [capitalGains])
  const taxableIncome = totalDividend + totalCapitalGain

  // Group Capital Gains by Symbol for the table
  const groupedGains = useMemo(() => {
    const map = new Map<string, { qty: number, sellValue: number, costValue: number, gain: number }>()
    capitalGains.forEach(g => {
      if (!map.has(g.symbol)) {
        map.set(g.symbol, { qty: 0, sellValue: 0, costValue: 0, gain: 0 })
      }
      const item = map.get(g.symbol)!
      item.qty += g.qtySold
      item.sellValue += g.sellValue
      item.costValue += g.costValue
      item.gain += g.realizedGain
    })
    return Array.from(map.entries()).map(([symbol, data]) => ({ symbol, ...data }))
  }, [capitalGains])

  // Group Dividends by Symbol
  const groupedDividends = useMemo(() => {
    const map = new Map<string, number>()
    dividends.forEach(d => {
      map.set(d.symbol, (map.get(d.symbol) || 0) + d.amount)
    })
    return Array.from(map.entries()).map(([symbol, amount]) => ({ symbol, amount }))
  }, [dividends])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="w-full space-y-6 sm:px-0">
      
      {/* Header and Controls (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center">
            <FileText className="w-6 h-6 mr-2 text-indigo-600" />
            Tax & Capital Gain Report
          </h1>
          <p className="text-sm text-gray-500 mt-1">Generate reports for your tax returns based on Financial Year (July-June).</p>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative">
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-2 pl-4 pr-10 rounded-xl shadow-sm text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {availableYears.map(fy => (
                <option key={fy} value={fy}>FY {fy}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* --- PRINTABLE REPORT CONTENT --- */}
      <div className="print:block">
        
        {/* Print Header (Only visible on print) */}
        <div className="hidden print:block mb-8 border-b-2 border-gray-900 pb-4">
          <h1 className="text-3xl font-black text-gray-900">TrackFolio - Tax Report</h1>
          <p className="text-lg text-gray-700 font-semibold mt-2">Financial Year: {selectedFY}</p>
          <p className="text-sm text-gray-500 mt-1">Generated on: {new Date().toLocaleDateString('en-GB')}</p>
        </div>

        {/* 1. KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm print:border-gray-300 print:shadow-none">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Capital Gain</p>
                <h2 className={`text-2xl font-black mt-1 ${totalCapitalGain >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {totalCapitalGain >= 0 ? '+' : ''}৳{totalCapitalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
              </div>
              <div className={`p-2 rounded-lg ${totalCapitalGain >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {totalCapitalGain >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm print:border-gray-300 print:shadow-none">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Cash Dividend</p>
                <h2 className="text-2xl font-black mt-1 text-indigo-600">
                  ৳{totalDividend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
              </div>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Coins className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 rounded-2xl border border-gray-900 shadow-sm print:from-white print:to-white print:border-gray-300 print:shadow-none print:text-gray-900">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider print:text-gray-500">Gross Taxable Income</p>
                <h2 className="text-2xl font-black mt-1 text-white print:text-gray-900">
                  ৳{taxableIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
              </div>
              <div className="p-2 rounded-lg bg-gray-800 text-gray-300 print:bg-gray-100 print:text-gray-600">
                <Calculator className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Capital Gains Breakdown Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6 print:border-gray-300 print:shadow-none">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 print:bg-white print:border-gray-300 flex items-center">
            <Briefcase className="w-4 h-4 mr-2 text-gray-500" />
            <h3 className="text-sm font-bold text-gray-900">Realized Capital Gains (Weighted Average Cost Method)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 print:divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                  <th scope="col" className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total Sold (Qty)</th>
                  <th scope="col" className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Cost Value (৳)</th>
                  <th scope="col" className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Sell Value (৳)</th>
                  <th scope="col" className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Net Gain/Loss (৳)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50 print:divide-gray-100">
                {groupedGains.length > 0 ? (
                  groupedGains.map((row) => (
                    <tr key={row.symbol} className="hover:bg-gray-50 transition-colors print:hover:bg-transparent">
                      <td className="px-5 py-3 whitespace-nowrap text-sm font-bold text-gray-900">{row.symbol}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 font-medium text-right">{row.qty.toLocaleString()}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 text-right">{row.costValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 text-right">{row.sellValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className={`px-5 py-3 whitespace-nowrap text-sm font-bold text-right ${row.gain >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {row.gain > 0 ? '+' : ''}{row.gain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500 bg-gray-50/50">
                      No sell transactions found in this financial year.
                    </td>
                  </tr>
                )}
              </tbody>
              {groupedGains.length > 0 && (
                <tfoot className="bg-gray-50 print:bg-white print:border-t-2 print:border-gray-300">
                  <tr>
                    <td colSpan={4} className="px-5 py-3 text-right text-sm font-bold text-gray-900">Total Capital Gain:</td>
                    <td className={`px-5 py-3 text-right text-sm font-black ${totalCapitalGain >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {totalCapitalGain > 0 ? '+' : ''}{totalCapitalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* 3. Dividend Income Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden print:border-gray-300 print:shadow-none print:break-inside-avoid">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 print:bg-white print:border-gray-300 flex items-center">
            <Coins className="w-4 h-4 mr-2 text-gray-500" />
            <h3 className="text-sm font-bold text-gray-900">Cash Dividend Income</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 print:divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                  <th scope="col" className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total Cash Received (৳)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50 print:divide-gray-100">
                {groupedDividends.length > 0 ? (
                  groupedDividends.map((row) => (
                    <tr key={row.symbol} className="hover:bg-gray-50 transition-colors print:hover:bg-transparent">
                      <td className="px-5 py-3 whitespace-nowrap text-sm font-bold text-gray-900">{row.symbol}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm font-bold text-indigo-600 text-right">
                        {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-5 py-8 text-center text-sm text-gray-500 bg-gray-50/50">
                      No dividend income found in this financial year.
                    </td>
                  </tr>
                )}
              </tbody>
              {groupedDividends.length > 0 && (
                <tfoot className="bg-gray-50 print:bg-white print:border-t-2 print:border-gray-300">
                  <tr>
                    <td className="px-5 py-3 text-right text-sm font-bold text-gray-900">Total Dividend:</td>
                    <td className="px-5 py-3 text-right text-sm font-black text-indigo-600">
                      {totalDividend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

      </div>

    </div>
  )
}
