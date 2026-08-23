'use client'

import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

interface DashboardPieChartsProps {
  portfolioData: any[]
  sectorData: any[]
  totalPortfolioValue: number
  dict: any
  COLORS: string[]
}

export default function DashboardPieCharts({ 
  portfolioData, 
  sectorData, 
  totalPortfolioValue, 
  dict,
  COLORS 
}: DashboardPieChartsProps) {
  
  const CustomPieTooltip = ({ active, payload, type }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percent = ((data.value / totalPortfolioValue) * 100).toFixed(1)
      return (
        <div className="bg-white dark:bg-gray-800 p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
          <p className="font-bold text-gray-900 dark:text-white text-xs">{data.name}</p>
          {type === 'portfolio' && (
            <p className="text-[10px] text-gray-600 dark:text-gray-300 mt-1">{dict.dashboard.shares}: {data.qty.toLocaleString()}</p>
          )}
          <p className="text-[10px] text-gray-600 dark:text-gray-300 mt-0.5">{dict.dashboard.invested}: ৳{data.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <div className="mt-1.5 text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md inline-block">
            {percent}%
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <>
      {/* Portfolio Allocation Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left: Portfolio Allocation */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 text-center">{dict.dashboard.portfolioAllocation}</h3>
          
          {portfolioData.length > 0 ? (
            <div className="flex-grow flex items-center justify-between min-h-[220px]">
              {/* Chart Side */}
              <div className="w-[55%] h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolioData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {portfolioData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="dark:hidden">
                      <tspan x="50%" dy="-0.5em" fontSize="11" fill="#6b7280" fontWeight="600">{dict.dashboard.totalValue}</tspan>
                      <tspan x="50%" dy="1.5em" fontSize="13" fill="#111827" fontWeight="900">
                        ৳{(totalPortfolioValue / 1000).toFixed(0)}k
                      </tspan>
                    </text>
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="hidden dark:block">
                      <tspan x="50%" dy="-0.5em" fontSize="11" fill="#9ca3af" fontWeight="600">{dict.dashboard.totalValue}</tspan>
                      <tspan x="50%" dy="1.5em" fontSize="13" fill="#f3f4f6" fontWeight="900">
                        ৳{(totalPortfolioValue / 1000).toFixed(0)}k
                      </tspan>
                    </text>
                    <RechartsTooltip content={<CustomPieTooltip type="portfolio" />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Info Side */}
              <div className="w-[45%] flex flex-col justify-center space-y-4 pl-4 border-l border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Total Assets</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{portfolioData.length}</p>
                </div>
                
                {portfolioData.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">{dict.dashboard.topHolding}</p>
                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: COLORS[0] }}></span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{portfolioData[0].name}</span>
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                          {((portfolioData[0].value / totalPortfolioValue) * 100).toFixed(1)}% <span className="text-gray-400 font-normal">{dict.dashboard.alloc}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center min-h-[200px] text-gray-400 text-sm">
              {dict.dashboard.noHoldings}
            </div>
          )}
        </div>

        {/* Right: Holdings Breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white text-center">{dict.dashboard.holdingsBreakdown}</h3>
          {portfolioData.length > 0 ? (
            <div className="flex-1 flex flex-col min-h-[220px] max-h-[220px] overflow-y-auto custom-scrollbar pr-2 mt-1 relative">
              <div className="flex flex-col w-full text-left">
                {/* Header Row */}
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-1 pt-1.5 border-b border-gray-100 dark:border-gray-800 mb-0.5 sticky top-0 bg-white dark:bg-gray-900 z-10">
                  <div className="w-[30%]">{dict.dashboard.symbol}</div>
                  <div className="w-[20%] text-right">{dict.dashboard.shares}</div>
                  <div className="w-[30%] text-right">{dict.dashboard.invested}</div>
                  <div className="w-[20%] text-right">{dict.dashboard.alloc}</div>
                </div>
                
                {/* Data Rows */}
                <div className="space-y-0">
                  {portfolioData.map((item, index) => {
                    const percent = totalPortfolioValue > 0 ? ((item.value / totalPortfolioValue) * 100).toFixed(1) : '0.0'
                    return (
                      <div key={index} className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors rounded-lg px-1 -mx-1">
                        <div className="flex items-center gap-1.5 w-[30%]">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white truncate" title={item.name}>{item.name}</span>
                        </div>
                        <div className="w-[20%] text-right text-[11px] font-medium text-gray-600 dark:text-gray-400 truncate">
                          {item.qty.toLocaleString()}
                        </div>
                        <div className="w-[30%] text-right text-[11px] font-bold text-gray-700 dark:text-gray-300 truncate">
                          ৳{(item.value >= 1000) ? `${(item.value/1000).toFixed(1)}k` : item.value.toLocaleString()}
                        </div>
                        <div className="w-[20%] text-right">
                          <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                            {percent}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center min-h-[220px] text-gray-400 text-sm">
              {dict.dashboard.noHoldings}
            </div>
          )}
        </div>
      </div>

      {/* Sector Allocation Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left: Sector Allocation Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 text-center">{dict.dashboard.sectorAllocation}</h3>
          
          {sectorData.length > 0 ? (
            <div className="flex-grow flex items-center justify-between min-h-[220px]">
              {/* Chart Side */}
              <div className="w-[55%] h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {sectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                      ))}
                    </Pie>
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="dark:hidden">
                      <tspan x="50%" dy="-0.5em" fontSize="11" fill="#6b7280" fontWeight="600">{dict.dashboard.sectors}</tspan>
                      <tspan x="50%" dy="1.5em" fontSize="14" fill="#111827" fontWeight="900">
                        {sectorData.length}
                      </tspan>
                    </text>
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="hidden dark:block">
                      <tspan x="50%" dy="-0.5em" fontSize="11" fill="#9ca3af" fontWeight="600">{dict.dashboard.sectors}</tspan>
                      <tspan x="50%" dy="1.5em" fontSize="14" fill="#f3f4f6" fontWeight="900">
                        {sectorData.length}
                      </tspan>
                    </text>
                    <RechartsTooltip content={<CustomPieTooltip type="sector" />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Info Side */}
              <div className="w-[45%] flex flex-col justify-center space-y-4 pl-4 border-l border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">{dict.dashboard.totalSectors}</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{sectorData.length}</p>
                </div>
                
                {sectorData.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">{dict.dashboard.dominantSector}</p>
                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: COLORS[3 % COLORS.length] }}></span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{sectorData[0].name}</span>
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                          {((sectorData[0].value / totalPortfolioValue) * 100).toFixed(1)}% <span className="text-gray-400 font-normal">{dict.dashboard.alloc}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center min-h-[200px] text-gray-400 text-sm">
              {dict.dashboard.noSectorData}
            </div>
          )}
        </div>

        {/* Right: Sector Breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white text-center">{dict.dashboard.sectorBreakdown}</h3>
          {sectorData.length > 0 ? (
            <div className="flex-1 flex flex-col min-h-[220px] max-h-[220px] overflow-y-auto custom-scrollbar pr-2 mt-1 relative">
              <div className="flex flex-col w-full text-left">
                {/* Header Row */}
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-1 pt-1.5 border-b border-gray-100 dark:border-gray-800 mb-0.5 sticky top-0 bg-white dark:bg-gray-900 z-10">
                  <div className="w-[50%]">{dict.dashboard.sector}</div>
                  <div className="w-[25%] text-right">{dict.dashboard.invested}</div>
                  <div className="w-[25%] text-right">{dict.dashboard.alloc}</div>
                </div>
                
                {/* Data Rows */}
                <div className="space-y-0">
                  {sectorData.map((item, index) => {
                    const percent = totalPortfolioValue > 0 ? ((item.value / totalPortfolioValue) * 100).toFixed(1) : '0.0'
                    return (
                      <div key={index} className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors rounded-lg px-1 -mx-1">
                        <div className="flex items-center gap-1.5 w-[50%]">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[(index + 3) % COLORS.length] }}></span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white truncate" title={item.name}>{item.name}</span>
                        </div>
                        <div className="w-[25%] text-right text-[11px] font-bold text-gray-700 dark:text-gray-300 truncate">
                          ৳{(item.value >= 1000) ? `${(item.value/1000).toFixed(1)}k` : item.value.toLocaleString()}
                        </div>
                        <div className="w-[25%] text-right">
                          <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                            {percent}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center min-h-[220px] text-gray-400 text-sm">
              {dict.dashboard.noSectorData}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
