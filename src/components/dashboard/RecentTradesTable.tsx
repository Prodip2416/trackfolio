'use client'

interface RecentTradesTableProps {
  recentTrades: any[]
  dict: any
}

export default function RecentTradesTable({ recentTrades, dict }: RecentTradesTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden w-full">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{dict.dashboard.recentTrades}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
          <thead className="bg-white dark:bg-gray-800/30">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{dict.dashboard.symbol}</th>
              <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{dict.dashboard.date}</th>
              <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{dict.dashboard.type}</th>
              <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{dict.dashboard.quantity}</th>
              <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{dict.dashboard.price}</th>
              <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{dict.dashboard.current}</th>
              <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">{dict.dashboard.total}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-50 dark:divide-gray-800">
            {recentTrades.length > 0 ? (
              recentTrades.map((txn) => {
                const total = (txn.quantity * txn.price_per_unit) + (txn.type === 'BUY' ? txn.brokerage_fee : -txn.brokerage_fee)
                return (
                  <tr key={txn.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-[13px] font-bold text-gray-900 dark:text-white">{txn.stocks.symbol}</div>
                      <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{txn.stocks.company_name}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] font-medium text-gray-500">
                      {new Date(txn.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                        txn.type === 'BUY' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400'
                      }`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-900 dark:text-white text-right font-semibold">
                      {txn.quantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-900 dark:text-white text-right">
                      {txn.price_per_unit.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-indigo-600 dark:text-indigo-400 font-semibold text-right">
                      {txn.stocks.current_price ? txn.stocks.current_price.toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] font-bold text-gray-900 dark:text-white text-right hidden sm:table-cell">
                      {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[13px] text-gray-500">
                  No trades found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
