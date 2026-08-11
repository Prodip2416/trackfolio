'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts'

type DataPoint = {
  name: string
  value: number
}

type Props = {
  sectorData: DataPoint[]
  categoryData: DataPoint[]
  topStocksData: DataPoint[]
  totalInvestment: number
}

// A vibrant and premium color palette for charts
const COLORS = [
  '#4f46e5', // indigo-600
  '#0ea5e9', // sky-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#8b5cf6', // violet-500
  '#ef4444', // red-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#6366f1'  // indigo-500
]

const CATEGORY_COLORS: Record<string, string> = {
  'A': '#22c55e', // Green for safest
  'B': '#3b82f6', // Blue for moderate
  'N': '#eab308', // Yellow for new
  'Z': '#ef4444', // Red for high risk
  'Unknown': '#9ca3af'
}

const CustomTooltip = ({ active, payload, total }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0.0'
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-sm">
        <p className="font-bold text-gray-900 mb-1">{data.name}</p>
        <p className="text-gray-600">
          Investment: ৳{data.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
        <p className="text-indigo-600 font-bold mt-1">
          {percent}% of Portfolio
        </p>
      </div>
    )
  }
  return null
}

export default function DiversificationClient({ sectorData, categoryData, topStocksData, totalInvestment }: Props) {
  
  if (totalInvestment <= 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-500">Add some stocks to your portfolio to see diversification metrics.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sector Allocation (Donut Chart) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Sector Allocation</h2>
            <p className="text-sm text-gray-500">Distribution of your investment across different market sectors.</p>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip total={totalInvestment} />} />
                <Legend 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  wrapperStyle={{ fontSize: '12px', color: '#4b5563' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category-wise Risk (Pie Chart) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Category Risk Profile</h2>
            <p className="text-sm text-gray-500">Exposure based on stock categories (A, B, Z, N).</p>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip total={totalInvestment} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Asset Concentration (Top 5 Stocks) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Asset Concentration (Top 5)</h2>
          <p className="text-sm text-gray-500">See how much of your portfolio is concentrated in your top holdings.</p>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topStocksData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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
              <RechartsTooltip content={<CustomTooltip total={totalInvestment} />} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                {topStocksData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}
