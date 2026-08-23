'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { CalendarDays, Clock, Activity } from 'lucide-react'

type TxnDetail = { symbol: string; type: string; quantity: number; amount: number }

type HeatmapData = {
  month: string
  monthIndex: number
  day: string
  dayIndex: number
  count: number
  details?: TxnDetail[]
}

type HoldingData = {
  name: string
  value: number
  fill: string
}

type Props = {
  heatmapData: HeatmapData[]
  holdingData: HoldingData[]
  avgHoldingDays: number
  totalSellTrades: number
}

// Ensure the days are ordered properly for Y Axis
const yTicks = [0, 1, 2, 3, 4, 5, 6]
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const monthTicks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function TimingClient({ heatmapData, holdingData, avgHoldingDays, totalSellTrades }: Props) {
  
  if (heatmapData.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Trading Activity</h3>
        <p className="text-gray-500">Add transactions to see your market timing analysis.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mr-4">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Avg. Holding Period</p>
            <h3 className="text-2xl font-black text-gray-900">{avgHoldingDays} Days</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mr-4">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Most Active Month</p>
            <h3 className="text-xl font-black text-gray-900">
              {heatmapData.length > 0 ? [...heatmapData].sort((a,b) => b.count - a.count)[0].month : 'N/A'}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mr-4">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Sells Analyzed</p>
            <h3 className="text-2xl font-black text-gray-900">{totalSellTrades}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Transaction Heatmap */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Transaction Heatmap</h2>
            <p className="text-sm text-gray-500">Shows which days of the week and months you trade the most. Larger circles mean more trades.</p>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f3f4f6" />
                <XAxis 
                  type="number" 
                  dataKey="monthIndex" 
                  name="Month" 
                  ticks={monthTicks}
                  tickFormatter={(val) => monthNames[val]}
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  domain={[0, 11]}
                />
                <YAxis 
                  type="number" 
                  dataKey="dayIndex" 
                  name="Day" 
                  ticks={yTicks}
                  tickFormatter={(val) => dayNames[val]}
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  domain={[0, 6]}
                  reversed={true} // Sun at top, Sat at bottom
                />
                <ZAxis type="number" dataKey="count" range={[50, 500]} name="Trades" />
                <RechartsTooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 text-sm min-w-[200px]">
                          <p className="font-bold text-gray-900 mb-2 border-b border-gray-100 pb-2">
                            {data.month} - {data.day}
                            <span className="ml-2 text-xs font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                              {data.count} Trades
                            </span>
                          </p>
                          
                          {data.details && data.details.length > 0 ? (
                            <div className="space-y-2 mt-2">
                              {data.details.map((txn: TxnDetail, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-xs">
                                  <span className="font-medium text-gray-700">
                                    <span className={txn.type === 'BUY' ? 'text-indigo-500' : 'text-sky-500'}>
                                      {txn.type}
                                    </span>
                                    {' '}{txn.symbol}
                                  </span>
                                  <span className="text-gray-500 font-medium">
                                    {txn.quantity} @ ৳{(txn.amount/txn.quantity).toFixed(1)}
                                  </span>
                                </div>
                              ))}
                              {data.count > 5 && (
                                <p className="text-xs text-gray-400 text-center mt-2 italic">+ {data.count - 5} more trades</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-indigo-600 font-semibold">{data.count} Trades</p>
                          )}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Scatter data={heatmapData} fill="#4f46e5" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Holding Period Analysis */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Holding Period Analysis</h2>
            <p className="text-sm text-gray-500">Distribution of how long you hold a stock before selling.</p>
          </div>

          {holdingData.length > 0 ? (
            <div className="h-[350px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={holdingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {holdingData.map((entry, index) => (
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
                            <p className="text-gray-600">{data.value} Trades</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Centered Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-2xl font-black text-indigo-600">{avgHoldingDays}d</span>
                <span className="text-xs font-semibold text-gray-400">AVG HOLD</span>
              </div>
            </div>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-center">
              <p className="text-gray-500">No sell transactions found to analyze holding period.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
