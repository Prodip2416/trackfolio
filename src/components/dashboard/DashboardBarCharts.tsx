'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { ChevronDown, Search } from 'lucide-react'

const YearSelect = ({ value, onChange, years }: { value: number, onChange: (val: number) => void, years: number[] }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredYears = years.filter(y => y.toString().includes(search))

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-28 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
      >
        <span>{value}</span>
        <ChevronDown className="w-3.5 h-3.5 ml-2 text-gray-500" />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 z-50 w-36 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden">
            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredYears.length > 0 ? (
                filteredYears.map(year => (
                  <button
                    key={year}
                    onClick={() => {
                      onChange(year)
                      setIsOpen(false)
                      setSearch('')
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${year === value ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    {year}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-gray-500 text-center">No years</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

interface DashboardBarChartsProps {
  activityData: any[]
  dividendHistoryData: any[]
  sellHistoryData: any[]
  selectedActivityYear: number
  selectedDividendYear: number
  selectedSellYear: number
  activityYears: number[]
  dividendYears: number[]
  sellYears: number[]
  setSelectedActivityYear: (y: number) => void
  setSelectedDividendYear: (y: number) => void
  setSelectedSellYear: (y: number) => void
  selectedYearTotalDividend: number
  selectedYearTotalSell: number
  dict: any
  theme?: string
}

export default function DashboardBarCharts({
  activityData,
  dividendHistoryData,
  sellHistoryData,
  selectedActivityYear,
  selectedDividendYear,
  selectedSellYear,
  activityYears,
  dividendYears,
  sellYears,
  setSelectedActivityYear,
  setSelectedDividendYear,
  setSelectedSellYear,
  selectedYearTotalDividend,
  selectedYearTotalSell,
  dict,
  theme
}: DashboardBarChartsProps) {
  
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg min-w-[160px]">
          <p className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-1.5 mb-1.5">{label}</p>
          <p className="text-xs font-bold text-indigo-600 mb-2">
            Total: ৳{data.buyAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {data.buyDetails && data.buyDetails.length > 0 && (
            <div className="space-y-1.5">
              {data.buyDetails.map((d: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-600 dark:text-gray-300 font-medium">
                    {d.symbol} <span className="text-gray-400">({d.quantity.toLocaleString()})</span>
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 font-bold ml-4">
                    ৳{d.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  const CustomDividendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg min-w-[160px]">
          <p className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-1.5 mb-1.5">{label}</p>
          <p className="text-xs font-bold text-emerald-600 mb-2">
            Total: ৳{data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {data.details && data.details.length > 0 && (
            <div className="space-y-1.5">
              {data.details.map((d: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-600 dark:text-gray-300 font-medium">{d.symbol}</span>
                  <span className="text-gray-900 dark:text-gray-100 font-bold ml-4">৳{d.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  const CustomSellTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg min-w-[160px]">
          <p className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-1.5 mb-1.5">{label}</p>
          <p className="text-xs font-bold text-rose-600 mb-2">
            Total: ৳{data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {data.details && data.details.length > 0 && (
            <div className="space-y-1.5">
              {data.details.map((d: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-600 dark:text-gray-300 font-medium">
                    {d.symbol} <span className="text-gray-400">({d.quantity.toLocaleString()})</span>
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 font-bold ml-4">৳{d.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <>
      {/* Monthly Trade Activity Bar Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col w-full">
        <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{dict.dashboard.tradeActivity}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{dict.dashboard.monthlyBreakdown}</p>
          </div>
          <div className="flex items-center space-x-2">
            <YearSelect value={selectedActivityYear} onChange={setSelectedActivityYear} years={activityYears} />
          </div>
        </div>
        
        {activityData.length > 0 ? (
          <div className="flex-grow min-h-[200px]">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 10 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  tickFormatter={(val) => `৳${(val/1000).toFixed(0)}k`}
                />
                <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f3f4f6' }} />
                <Bar dataKey="buyAmount" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center min-h-[200px] text-gray-400 text-sm">
            {dict.dashboard.noTrades}
          </div>
        )}
      </div>

      {/* Dividend History Row */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{dict.dashboard.dividendIncome}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{dict.dashboard.monthlyBreakdown}</p>
          </div>
          <div className="flex items-center space-x-4">
            <YearSelect 
              value={selectedDividendYear}
              onChange={setSelectedDividendYear}
              years={dividendYears}
            />
            <div className="text-right hidden sm:block bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
              <p className="text-[13px] font-extrabold text-emerald-600 dark:text-emerald-400">
                ৳{selectedYearTotalDividend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex-grow min-h-[250px]">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dividendHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 10 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 10 }}
                tickFormatter={(val) => `৳${(val/1000).toFixed(0)}k`}
              />
              <RechartsTooltip content={<CustomDividendTooltip />} cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f3f4f6' }} />
              <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sell Income Row */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{dict.dashboard.sellIncome}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{dict.dashboard.monthlyBreakdown}</p>
          </div>
          <div className="flex items-center space-x-4">
            <YearSelect 
              value={selectedSellYear}
              onChange={setSelectedSellYear}
              years={sellYears}
            />
            <div className="text-right hidden sm:block bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-800/30">
              <p className="text-[13px] font-extrabold text-rose-600 dark:text-rose-400">
                ৳{selectedYearTotalSell.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex-grow min-h-[250px]">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sellHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 10 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 10 }}
                tickFormatter={(val) => `৳${(val/1000).toFixed(0)}k`}
              />
              <RechartsTooltip content={<CustomSellTooltip />} cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f3f4f6' }} />
              <Bar dataKey="amount" fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}
