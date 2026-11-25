'use client'

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export type ChartPoint = { label: string; value: number | null; text: string }

/** Year → return % bars (green up, red down). Years without a measurable return have no bar. */
export default function ReturnsChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="h-[300px] w-full" data-testid="returns-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-200 dark:text-gray-800" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={v => `${v}%`} width={48} />
          <ReferenceLine y={0} stroke="#9ca3af" />
          <Tooltip
            cursor={{ fill: 'rgba(148,163,184,0.12)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0].payload as ChartPoint
              return (
                <div className="bg-white dark:bg-gray-900 p-3 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 text-sm">
                  <p className="font-bold text-gray-900 dark:text-white">{p.label}</p>
                  <p className="text-gray-600 dark:text-gray-300">{p.text}</p>
                </div>
              )
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 6, 6]} maxBarSize={56}>
            {data.map(d => (
              <Cell key={d.label} fill={(d.value ?? 0) >= 0 ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
