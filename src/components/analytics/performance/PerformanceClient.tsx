'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Treemap,
  AreaChart,
  Area
} from 'recharts'

type PerformanceData = {
  name: string
  investment: number
  currentValue: number
  gainLoss: number
  gainLossPercent: number
  isProfit: boolean
}

type HistoryData = {
  date: string
  investment: number
}

// Custom Tooltip for Treemap
const TreemapTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-sm">
        <p className="font-bold text-gray-900 mb-1">{data.name}</p>
        <p className="text-gray-600">Investment: ৳{data.investment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        <p className="text-gray-600">Current Value: ৳{data.currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        <p className={`font-semibold mt-1 ${data.isProfit ? 'text-green-600' : 'text-red-600'}`}>
          {data.isProfit ? '+' : ''}{data.gainLoss.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({data.gainLossPercent.toFixed(2)}%)
        </p>
      </div>
    )
  }
  return null
}

// Custom render for Treemap blocks
const CustomizedContent = (props: any) => {
  const { root, depth, x, y, width, height, index, payload, name, gainLossPercent, isProfit } = props

  // Recharts Treemap root node might not have custom properties. Skip or fallback.
  if (depth === 0 || depth === undefined || gainLossPercent === undefined) {
    return null
  }

  // Calculate opacity based on gainLossPercent (max cap at 100% for 1 opacity, min 0.3)
  const intensity = Math.min(Math.abs(gainLossPercent) / 20, 1) // 20% gain/loss means full color
  const opacity = 0.4 + (intensity * 0.6)
  
  const bgColor = isProfit ? `rgba(34, 197, 94, ${opacity})` : `rgba(239, 68, 68, ${opacity})`

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: bgColor,
          stroke: '#fff',
          strokeWidth: 2,
        }}
      />
      {
        width > 50 && height > 30 ? (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            fill="#fff"
            fontSize={12}
            fontWeight="bold"
            dy={-4}
          >
            {name}
            <tspan x={x + width / 2} dy={16} fontSize={10} fontWeight="normal">
              {gainLossPercent.toFixed(1)}%
            </tspan>
          </text>
        ) : null
      }
    </g>
  )
}

export default function PerformanceClient({ data, historyData }: { data: PerformanceData[], historyData?: HistoryData[] }) {
  
  // Prepare Treemap data (Recharts expects size property)
  const treemapData = useMemo(() => {
    return data.map(d => ({
      ...d,
      size: d.investment > 0 ? d.investment : 1 // fallback size if 0
    }))
  }, [data])

  // Prepare Top/Bottom 5 BarChart data
  const barChartData = useMemo(() => {
    // Sort by gainLoss descending
    const sorted = [...data].sort((a, b) => b.gainLoss - a.gainLoss)
    
    // If user has 10 or fewer stocks, show all of them so nothing goes missing
    if (sorted.length <= 10) {
      return sorted
    }

    // Otherwise, strictly take the Top 5 and Bottom 5
    const gainers = sorted.slice(0, 5)
    const losers = sorted.slice(-5)

    return [...gainers, ...losers]
  }, [data])

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-500">Add some stocks to your portfolio to see performance analysis.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Portfolio Value vs. Invested Amount Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Investment Growth Over Time</h2>
          <p className="text-sm text-gray-500">Cumulative total invested amount (cash flow) across months.</p>
        </div>

        {historyData && historyData.length > 0 ? (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInvestment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(val) => `৳${(val/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-sm">
                          <p className="font-bold text-gray-900 mb-1">{label}</p>
                          <p className="text-indigo-600 font-semibold">
                            Total Invested: ৳{payload[0].value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area type="monotone" dataKey="investment" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorInvestment)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-500">Not enough transaction history to show a chart.</p>
          </div>
        )}
      </div>

      {/* Treemap Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Unrealized Gain/Loss Heatmap</h2>
          <p className="text-sm text-gray-500">Box size represents investment amount. Color indicates profit (green) or loss (red).</p>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="#fff"
              content={<CustomizedContent />}
            >
              <Tooltip content={<TreemapTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Gainers vs Losers Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Top Gainers vs. Top Losers</h2>
          <p className="text-sm text-gray-500">Top 5 profitable and top 5 losing stocks by absolute amount.</p>
        </div>

        {barChartData.length > 0 ? (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(val) => `৳${Math.abs(val)}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-sm">
                          <p className="font-bold text-gray-900">{data.name}</p>
                          <p className={`font-semibold ${data.isProfit ? 'text-green-600' : 'text-red-600'}`}>
                            {data.isProfit ? 'Profit' : 'Loss'}: ৳{Math.abs(data.gainLoss).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="gainLoss" radius={[4, 4, 4, 4]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isProfit ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-500">Not enough data for Gainers/Losers comparison.</p>
          </div>
        )}
      </div>

    </div>
  )
}
