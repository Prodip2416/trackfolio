import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import TimingClient from './TimingClient'

export const metadata = {
  title: 'Market Timing - TrackFolio',
}

export default async function TimingAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch all transactions
  const transactions = await prisma.transactions.findMany({
    where: { user_id: user.id },
    orderBy: { transaction_date: 'asc' },
    select: {
      type: true,
      stock_id: true,
      transaction_date: true,
      quantity: true,
      price_per_unit: true,
      stocks: {
        select: {
          symbol: true,
          created_at: true
        }
      }
    }
  })

  // 1. Transaction Heatmap (Activity by Month and Day of Week)
  type TxnDetail = { symbol: string; type: string; quantity: number; amount: number }
  const heatmapMap = new Map<string, { count: number; details: TxnDetail[] }>()
  
  // 2. Holding Period Analysis
  const firstBuyMap = new Map<string, Date>()
  const holdingPeriods: number[] = []

  transactions.forEach(txn => {
    const date = new Date(txn.transaction_date)
    
    // For Heatmap
    const day = date.getDay() // 0 = Sunday, 1 = Monday...
    const month = date.getMonth() // 0 = Jan...
    const key = `${month}-${day}`
    
    if (!heatmapMap.has(key)) {
      heatmapMap.set(key, { count: 0, details: [] })
    }
    const entry = heatmapMap.get(key)!
    entry.count++
    entry.details.push({
      symbol: txn.stocks?.symbol || 'Unknown',
      type: txn.type,
      quantity: Number(txn.quantity),
      amount: Number(txn.quantity) * Number(txn.price_per_unit)
    })

    // For Holding Period
    if (txn.stock_id) {
      if (txn.type === 'BUY') {
        // Record the first buy date if it doesn't exist
        if (!firstBuyMap.has(txn.stock_id)) {
          firstBuyMap.set(txn.stock_id, date)
        }
      } else if (txn.type === 'SELL') {
        let firstBuy = firstBuyMap.get(txn.stock_id)
        
        // Fallback: if no BUY found, try using the stock's created_at date
        if (!firstBuy && txn.stocks?.created_at) {
          firstBuy = new Date(txn.stocks.created_at)
        }

        if (firstBuy) {
          const diffTime = Math.abs(date.getTime() - firstBuy.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          holdingPeriods.push(diffDays)
        }
      }
    }
  })

  // Format Heatmap Data (Scatter format for Recharts)
  const heatmapData = []
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  for (let m = 0; m < 12; m++) {
    for (let d = 0; d < 7; d++) {
      // DSE is open Sun-Thu, but we check all 7 days just in case
      const entry = heatmapMap.get(`${m}-${d}`)
      if (entry && entry.count > 0) {
        // Sort details to show highest amount first
        entry.details.sort((a, b) => b.amount - a.amount)
        
        heatmapData.push({
          month: monthNames[m],
          monthIndex: m,
          day: dayNames[d],
          dayIndex: d,
          count: entry.count,
          details: entry.details.slice(0, 5) // keep max 5 to prevent huge tooltips
        })
      }
    }
  }

  // Format Holding Period Data
  let shortTerm = 0 // < 30 days
  let mediumTerm = 0 // 30 - 180 days
  let longTerm = 0 // > 180 days

  holdingPeriods.forEach(days => {
    if (days < 30) shortTerm++
    else if (days <= 180) mediumTerm++
    else longTerm++
  })

  const holdingData = [
    { name: 'Short-term (< 1 Month)', value: shortTerm, fill: '#ef4444' }, // Red (risky/trading)
    { name: 'Medium-term (1-6 Months)', value: mediumTerm, fill: '#f59e0b' }, // Yellow
    { name: 'Long-term (> 6 Months)', value: longTerm, fill: '#10b981' } // Green (safe/investing)
  ].filter(d => d.value > 0)

  // Calculate average holding period
  const totalDays = holdingPeriods.reduce((a, b) => a + b, 0)
  const avgHoldingDays = holdingPeriods.length > 0 ? Math.round(totalDays / holdingPeriods.length) : 0

  return (
    <AppLayout user={user} title="Market Timing">
      <TimingClient 
        heatmapData={heatmapData}
        holdingData={holdingData}
        avgHoldingDays={avgHoldingDays}
        totalSellTrades={holdingPeriods.length}
      />
    </AppLayout>
  )
}
