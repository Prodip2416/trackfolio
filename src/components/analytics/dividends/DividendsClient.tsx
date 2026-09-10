'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { Coins, Target, TrendingUp, Calendar, CalendarDays, CalendarRange, Sun, Clock, Timer, Zap } from 'lucide-react'
import SearchableDropdown from '@/components/shared/SearchableDropdown'

type YearlyData = {
  year: string
  amount: number
}

type StockData = {
  name: string
  amount: number
}

type Props = {
  yearlyData: YearlyData[]
  topStocksData: StockData[]
  totalDividend: number
  totalInvestment: number
  overallYield: number
}

const COLORS = [
  '#4f46e5', // indigo-600
  '#0ea5e9', // sky-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
]

export default function DividendsClient({ yearlyData, topStocksData, totalDividend, totalInvestment, overallYield }: Props) {
  const currentYear = new Date().getFullYear().toString()
  const availableYears = yearlyData.map(d => d.year).sort((a, b) => Number(b) - Number(a))
  
  const [selectedYear, setSelectedYear] = useState<string>(
    availableYears.includes(currentYear) ? currentYear : (availableYears.length > 0 ? availableYears[0] : 'All')
  )

  const activeAmount = selectedYear === 'All' 
    ? totalDividend 
    : (yearlyData.find(d => d.year === selectedYear)?.amount || 0)

  const yearly = activeAmount
  const monthly = activeAmount / 12
  const weekly = activeAmount / 52.1429
  const daily = activeAmount / 365.25
  const hourly = daily / 24
  const perMin = hourly / 60
  const perSec = perMin / 60
  
  if (totalDividend <= 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Dividend Data</h3>
        <p className="text-gray-500">Log some cash dividends in the Dividend Log to see insights here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mr-4">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Dividend Income</p>
            <h3 className="text-2xl font-black text-gray-900">৳{totalDividend.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mr-4">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Investment</p>
            <h3 className="text-2xl font-black text-gray-900">৳{totalInvestment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mr-4">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Overall Portfolio Yield</p>
            <h3 className="text-2xl font-black text-gray-900">{overallYield.toFixed(2)}%</h3>
          </div>
        </div>
      </div>

      {/* Passive Income Speed */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Passive Income Speed</h2>
            <p className="text-sm text-gray-500">Your dividend income broken down by time.</p>
          </div>
          <div className="min-w-[140px]">
            <SearchableDropdown
              options={[
                { label: 'All Time', value: 'All' },
                ...availableYears.map(year => ({ label: year, value: year }))
              ]}
              value={selectedYear}
              onChange={setSelectedYear}
              placeholder="Select Year"
              searchPlaceholder="Search year..."
              buttonClassName="px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm text-sm font-medium text-gray-900 dark:text-white min-h-[38px] w-full text-left"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Yearly */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 shadow-sm text-white relative overflow-hidden group">
            <Calendar className="absolute right-[-10px] bottom-[-10px] w-16 h-16 text-white/20 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-white/95 mb-1 relative z-10 uppercase tracking-wide">Yearly</p>
            <p className="text-lg font-extrabold text-white relative z-10">৳{yearly.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
          
          {/* Monthly */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 shadow-sm text-white relative overflow-hidden group">
            <CalendarDays className="absolute right-[-10px] bottom-[-10px] w-16 h-16 text-white/20 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-white/95 mb-1 relative z-10 uppercase tracking-wide">Monthly</p>
            <p className="text-lg font-extrabold text-white relative z-10">৳{monthly.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>

          {/* Weekly */}
          <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-4 shadow-sm text-white relative overflow-hidden group">
            <CalendarRange className="absolute right-[-10px] bottom-[-10px] w-16 h-16 text-white/20 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-white/95 mb-1 relative z-10 uppercase tracking-wide">Weekly</p>
            <p className="text-lg font-extrabold text-white relative z-10">৳{weekly.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>

          {/* Daily */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 shadow-sm text-white relative overflow-hidden group">
            <Sun className="absolute right-[-10px] bottom-[-10px] w-16 h-16 text-white/20 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-white/95 mb-1 relative z-10 uppercase tracking-wide">Daily</p>
            <p className="text-lg font-extrabold text-white relative z-10">৳{daily.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>

          {/* Hourly */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 shadow-sm text-white relative overflow-hidden group">
            <Clock className="absolute right-[-10px] bottom-[-10px] w-16 h-16 text-white/20 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-white/95 mb-1 relative z-10 uppercase tracking-wide">Hourly</p>
            <p className="text-lg font-extrabold text-white relative z-10">৳{hourly.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>

          {/* Per Min */}
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-4 shadow-sm text-white relative overflow-hidden group">
            <Timer className="absolute right-[-10px] bottom-[-10px] w-16 h-16 text-white/20 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-white/95 mb-1 relative z-10 uppercase tracking-wide">Per Min</p>
            <p className="text-lg font-extrabold text-white relative z-10">৳{perMin.toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 4})}</p>
          </div>

          {/* Per Sec */}
          <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-4 shadow-sm text-white relative overflow-hidden group">
            <Zap className="absolute right-[-10px] bottom-[-10px] w-16 h-16 text-white/20 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-white/95 mb-1 relative z-10 uppercase tracking-wide">Per Sec</p>
            <p className="text-lg font-extrabold text-white relative z-10">৳{perSec.toLocaleString(undefined, {minimumFractionDigits: 6, maximumFractionDigits: 6})}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Year-on-Year Dividend Income */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Year-on-Year Dividend</h2>
            <p className="text-sm text-gray-500">Compare your cash dividend income across different years.</p>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(val) => `৳${(val/1000).toFixed(0)}k`}
                />
                <RechartsTooltip 
                  cursor={{ fill: '#f9fafb' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-sm">
                          <p className="font-bold text-gray-900">{data.year}</p>
                          <p className="text-indigo-600 font-semibold mt-1">
                            Income: ৳{data.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Dividend Paying Stocks */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Top Dividend Payers</h2>
            <p className="text-sm text-gray-500">The top 5 stocks that generated the most cash dividend.</p>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topStocksData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  type="number" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(val) => `৳${(val/1000).toFixed(0)}k`}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 'bold' }} 
                />
                <RechartsTooltip 
                  cursor={{ fill: '#f9fafb' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-sm">
                          <p className="font-bold text-gray-900">{data.name}</p>
                          <p className="text-indigo-600 font-semibold mt-1">
                            Dividends: ৳{data.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={32}>
                  {topStocksData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}
