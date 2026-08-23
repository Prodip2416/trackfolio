'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

type VolumeData = {
  month: string
  buy: number
  sell: number
}

type RatioData = {
  name: string
  value: number
  fill: string
}

type Props = {
  volumeData: VolumeData[]
  ratioData: RatioData[]
  winRatio: number
  lossRatio: number
  totalTrades: number
}

export default function TradingClient({ volumeData, ratioData, winRatio, lossRatio, totalTrades }: Props) {
  
  if (volumeData.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Trading Data</h3>
        <p className="text-gray-500">Log some Buy and Sell transactions to see your trading behavior analysis.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mr-4">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Sell Trades</p>
            <h3 className="text-2xl font-black text-gray-900">{totalTrades}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mr-4">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Winning Trades (Profit)</p>
            <h3 className="text-2xl font-black text-gray-900">{winRatio.toFixed(1)}%</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mr-4">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Losing Trades (Loss)</p>
            <h3 className="text-2xl font-black text-gray-900">{lossRatio.toFixed(1)}%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Buy vs Sell Volume */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Buy vs. Sell Volume</h2>
            <p className="text-sm text-gray-500">Compare how much you invested (Buy) vs cashed out (Sell) each month.</p>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(val) => `৳${(val/1000).toFixed(0)}k`}
                />
                <RechartsTooltip 
                  cursor={{ fill: '#f9fafb' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 text-sm">
                          <p className="font-bold text-gray-900 mb-2 border-b border-gray-100 pb-2">{label}</p>
                          {payload.map((entry, index) => (
                            <p key={index} style={{ color: entry.color }} className="font-semibold flex justify-between gap-4 mt-1">
                              <span>{entry.name}:</span>
                              <span>৳{Number(entry.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </p>
                          ))}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Bar dataKey="buy" name="Buy Volume" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sell" name="Sell Volume" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Realized Profit/Loss Ratio */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-gray-900">Win/Loss Ratio</h2>
            <p className="text-sm text-gray-500">Success rate of your past sells.</p>
          </div>

          {totalTrades > 0 ? (
            <div className="h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ratioData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {ratioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-sm">
                            <p className="font-bold text-gray-900 mb-1">{data.name}</p>
                            <p className="text-gray-600">{data.value} trades</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Centered Text inside Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-3xl font-black text-emerald-500">{winRatio.toFixed(0)}%</span>
                <span className="text-xs font-semibold text-gray-400">WIN RATE</span>
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-center">
              <p className="text-gray-500">No Sell transactions found to calculate Win/Loss ratio.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
