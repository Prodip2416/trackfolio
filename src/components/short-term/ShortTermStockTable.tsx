import { Search } from 'lucide-react'

type StockRow = {
  symbol: string
  totalInvest: number
  gainTotal: number
  lossTotal: number
  tradeCount: number
  totalFee: number
}

export default function ShortTermStockTable({ data }: { data: StockRow[] }) {
  const money = (n: number) => `৳${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-colors duration-200">
      <div className="px-5 pt-4 pb-2">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Stock Performance</h2>
      </div>
      {/* Only this area scrolls — header stays fixed, ~7 rows visible before scroll kicks in */}
      <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-xs text-left">
          <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-200/50 dark:border-slate-800 sticky top-0 z-20 backdrop-blur-md">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Stock</th>
              <th className="px-4 py-2.5 font-semibold text-right">Total Invest</th>
              <th className="px-4 py-2.5 font-semibold text-right">Total Gain</th>
              <th className="px-4 py-2.5 font-semibold text-right">Total Loss</th>
              <th className="px-4 py-2.5 font-semibold text-right">Trades</th>
              <th className="px-4 py-2.5 font-semibold text-right">Total Fee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50 dark:divide-slate-800/50">
            {data.map(row => (
              <tr key={row.symbol} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                  {row.symbol}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-gray-600 dark:text-gray-300">
                  {money(row.totalInvest)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-emerald-600 dark:text-emerald-400">
                  {row.gainTotal > 0 ? money(row.gainTotal) : '-'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-rose-600 dark:text-rose-400">
                  {row.lossTotal > 0 ? money(row.lossTotal) : '-'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-gray-900 dark:text-white">
                  {row.tradeCount}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-gray-600 dark:text-gray-300">
                  {money(row.totalFee)}
                </td>
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    <p className="text-base font-medium text-gray-900 dark:text-gray-200">No trades yet</p>
                    <p className="text-sm">Log a short-term trade to see stock-wise performance here.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
