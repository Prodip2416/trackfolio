import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ShortTermSummaryCards from '@/components/short-term/ShortTermSummaryCards'
import ShortTermStockTable from '@/components/short-term/ShortTermStockTable'
import { getShortTermTrades } from './actions'

export const metadata = {
  title: 'Short Term Dashboard - TrackFolio',
}

export default async function ShortTermDashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const trades = await getShortTermTrades()
  const totalRealizedProfit = trades.reduce((sum, t) => sum + t.realized_profit, 0)
  const openTradesCount = trades.filter(t => t.status === 'OPEN').length
  const closedTradesCount = trades.filter(t => t.status === 'CLOSED').length

  // Total fees: every brokerage fee ever paid across every buy/sell leg of every trade.
  const totalFees = trades.reduce(
    (sum, trade) => sum + trade.legs.reduce((legSum, leg) => legSum + leg.brokerage_fee, 0),
    0
  )

  // Per-stock breakdown: invested capital (buy legs only), realized gain/loss split,
  // trade campaign count, and fees paid — all grouped by symbol.
  const stockMap = new Map<string, {
    symbol: string
    totalInvest: number
    gainTotal: number
    lossTotal: number
    tradeCount: number
    totalFee: number
  }>()

  trades.forEach(trade => {
    if (!stockMap.has(trade.symbol)) {
      stockMap.set(trade.symbol, {
        symbol: trade.symbol,
        totalInvest: 0,
        gainTotal: 0,
        lossTotal: 0,
        tradeCount: 0,
        totalFee: 0
      })
    }
    const entry = stockMap.get(trade.symbol)!
    entry.tradeCount += 1

    if (trade.realized_profit > 0) {
      entry.gainTotal += trade.realized_profit
    } else if (trade.realized_profit < 0) {
      entry.lossTotal += Math.abs(trade.realized_profit)
    }

    trade.legs.forEach(leg => {
      entry.totalFee += leg.brokerage_fee
      if (leg.type === 'BUY') {
        entry.totalInvest += leg.quantity * leg.price_per_unit
      }
    })
  })

  const stockBreakdown = Array.from(stockMap.values()).sort((a, b) => b.totalInvest - a.totalInvest)

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900 rounded-tl-2xl border-t border-l border-gray-200 dark:border-gray-800 transition-colors">
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <ShortTermSummaryCards
            totalRealizedProfit={totalRealizedProfit}
            openTradesCount={openTradesCount}
            closedTradesCount={closedTradesCount}
            totalFees={totalFees}
          />
          <ShortTermStockTable data={stockBreakdown} />
        </div>
      </main>
    </div>
  )
}
