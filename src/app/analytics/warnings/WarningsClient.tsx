'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine
} from 'recharts'
import { AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react'

type ExposureData = {
  symbol: string
  investment: number
  percentage: number
  isHighRisk: boolean
}

type Props = {
  exposures: ExposureData[]
  totalInvestment: number
  riskThreshold: number
}

const GAUGE_COLORS = {
  safe: '#10b981', // green
  warning: '#f59e0b', // yellow/orange
  danger: '#ef4444', // red
  background: '#f3f4f6' // gray
}

export default function WarningsClient({ exposures, totalInvestment, riskThreshold }: Props) {
  
  if (exposures.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Portfolio</h3>
        <p className="text-gray-500">Buy some stocks to analyze your portfolio risk.</p>
      </div>
    )
  }

  // The stock with the highest exposure
  const topExposure = exposures[0]
  const isHighRisk = topExposure.percentage >= riskThreshold

  // Gauge Chart Data (Half Donut)
  // Value 1 is the actual percentage, Value 2 is the remainder (100 - percentage)
  const gaugeData = [
    { name: topExposure.symbol, value: topExposure.percentage },
    { name: 'Remaining', value: Math.max(0, 100 - topExposure.percentage) }
  ]

  const getGaugeColor = (percent: number) => {
    if (percent >= riskThreshold) return GAUGE_COLORS.danger
    if (percent >= riskThreshold - 5) return GAUGE_COLORS.warning
    return GAUGE_COLORS.safe
  }

  const highRiskCount = exposures.filter(e => e.isHighRisk).length

  return (
    <div className="space-y-6">
      
      {/* Alert Banner if High Risk Exists */}
      {highRiskCount > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-bold">High Exposure Warning</h3>
            <p className="text-red-700 text-sm mt-1">
              You have {highRiskCount} stock(s) that exceed {riskThreshold}% of your total portfolio. Over-concentration in a single asset increases your overall risk.
            </p>
          </div>
        </div>
      )}

      {highRiskCount === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start gap-4">
          <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-emerald-800 font-bold">Healthy Diversification</h3>
            <p className="text-emerald-700 text-sm mt-1">
              Your portfolio has no single stock exceeding the {riskThreshold}% risk threshold. Good job maintaining a diversified portfolio!
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Single Stock Exposure Gauge (Top Stock) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1 flex flex-col items-center">
          <div className="mb-2 text-center w-full">
            <h2 className="text-lg font-bold text-gray-900">Highest Exposure</h2>
            <p className="text-sm text-gray-500">Your top holding vs Total Portfolio</p>
          </div>

          <div className="h-[250px] w-full relative mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="70%" // Push down to center the half circle
                  startAngle={180}
                  endAngle={0}
                  innerRadius={80}
                  outerRadius={120}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill={getGaugeColor(topExposure.percentage)} />
                  <Cell fill={GAUGE_COLORS.background} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Gauge Needle / Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none pb-4">
              <span className="text-4xl font-black" style={{ color: getGaugeColor(topExposure.percentage) }}>
                {topExposure.percentage.toFixed(1)}%
              </span>
              <span className="text-sm font-bold text-gray-700 mt-1">{topExposure.symbol}</span>
            </div>
          </div>

          <div className="mt-4 text-center w-full px-4 py-3 bg-gray-50 rounded-xl">
            {isHighRisk ? (
              <p className="text-sm text-red-600 font-medium flex items-center justify-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Too concentrated! Consider rebalancing.
              </p>
            ) : (
              <p className="text-sm text-emerald-600 font-medium flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Safe allocation range.
              </p>
            )}
          </div>
        </div>

        {/* All Stocks Exposure Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Portfolio Exposure Distribution</h2>
            <p className="text-sm text-gray-500">Percentage weight of all stocks in your portfolio. Red line indicates {riskThreshold}% threshold.</p>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={exposures}
                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="symbol" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }} 
                  tickFormatter={(val) => val.length > 6 ? val.substring(0, 6) + '..' : val}
                  interval={0}
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(val) => `${val}%`}
                  domain={[0, 'dataMax + 10']}
                />
                <RechartsTooltip 
                  cursor={{ fill: '#f9fafb' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as ExposureData
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-sm">
                          <p className="font-bold text-gray-900">{data.symbol}</p>
                          <p className={`font-semibold mt-1 ${data.isHighRisk ? 'text-red-600' : 'text-indigo-600'}`}>
                            {data.percentage.toFixed(1)}% of Portfolio
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Investment: ৳{data.investment.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <ReferenceLine y={riskThreshold} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'High Risk Threshold', fill: '#ef4444', fontSize: 10 }} />
                
                <Bar dataKey="percentage" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {exposures.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isHighRisk ? '#ef4444' : '#4f46e5'} />
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
