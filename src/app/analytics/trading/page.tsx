import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import TradingClient from './TradingClient'

export const metadata = {
  title: 'Trading Behavior - TrackFolio',
}

export default async function TradingAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch all transactions with associated stock info (for average buy price)
  const transactions = await prisma.transactions.findMany({
    where: { user_id: user.id },
    orderBy: { transaction_date: 'asc' },
    select: {
      type: true,
      quantity: true,
      price_per_unit: true,
      transaction_date: true,
      stocks: {
        select: {
          average_buy_price: true
        }
      }
    }
  })

  // 1. Buy vs Sell Volume (Monthly)
  const volumeMap = new Map<string, { month: string; buy: number; sell: number }>()
  
  // 2. Realized Profit/Loss (Win/Loss Ratio)
  let winCount = 0
  let lossCount = 0

  transactions.forEach(txn => {
    const date = new Date(txn.transaction_date)
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    const amount = Number(txn.quantity) * Number(txn.price_per_unit)

    // Ensure map entry exists
    if (!volumeMap.has(monthYear)) {
      volumeMap.set(monthYear, { month: monthYear, buy: 0, sell: 0 })
    }
    const monthData = volumeMap.get(monthYear)!

    if (txn.type === 'BUY') {
      monthData.buy += amount
    } else if (txn.type === 'SELL') {
      monthData.sell += amount
      
      // Calculate Win/Loss based on current average buy price
      const avgBuyPrice = txn.stocks?.average_buy_price ? Number(txn.stocks.average_buy_price) : 0
      const sellPrice = Number(txn.price_per_unit)
      
      if (avgBuyPrice > 0) {
        if (sellPrice > avgBuyPrice) {
          winCount++
        } else if (sellPrice < avgBuyPrice) {
          lossCount++
        }
        // If equal, neither win nor loss (or could be loss due to fees, but let's keep it simple)
      }
    }
  })

  const volumeData = Array.from(volumeMap.values())

  const totalTrades = winCount + lossCount
  const winRatio = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0
  const lossRatio = totalTrades > 0 ? (lossCount / totalTrades) * 100 : 0

  const ratioData = totalTrades > 0 ? [
    { name: 'Winning Trades', value: winCount, fill: '#10b981' },
    { name: 'Losing Trades', value: lossCount, fill: '#ef4444' }
  ] : []

  return (
    <AppLayout user={user} title="Trading Behavior">
      <TradingClient 
        volumeData={volumeData}
        ratioData={ratioData}
        winRatio={winRatio}
        lossRatio={lossRatio}
        totalTrades={totalTrades}
      />
    </AppLayout>
  )
}
