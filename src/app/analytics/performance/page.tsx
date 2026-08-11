import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import PerformanceClient from './PerformanceClient'

export const metadata = {
  title: 'Performance Analytics - TrackFolio',
}

export default async function PerformanceAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch all active stocks for the user
  const activeStocks = await prisma.stocks.findMany({
    where: { 
      user_id: user.id,
      total_quantity: { gt: 0 }
    },
    select: {
      symbol: true,
      dse_company: { select: { current_price: true } },
      total_quantity: true,
      total_investment: true,
    }
  })

  // Format the data for charting
  const performanceData = activeStocks.map(stock => {
    const total_investment = Number(stock.total_investment)
    const quantity = Number(stock.total_quantity)
    const current_price = stock.dse_company?.current_price ? Number(stock.dse_company.current_price) : 0
    
    const current_value = quantity * current_price
    const gain_loss = current_value - total_investment
    const gain_loss_percentage = total_investment > 0 ? (gain_loss / total_investment) * 100 : 0

    return {
      name: stock.symbol,
      investment: total_investment,
      currentValue: current_value,
      gainLoss: gain_loss,
      gainLossPercent: gain_loss_percentage,
      isProfit: gain_loss >= 0
    }
  })

  // Fetch all transactions to calculate cumulative investment over time
  const transactions = await prisma.transactions.findMany({
    where: { user_id: user.id },
    orderBy: { transaction_date: 'asc' },
    select: {
      type: true,
      quantity: true,
      price_per_unit: true,
      transaction_date: true,
      brokerage_fee: true
    }
  })

  let cumulativeInvestment = 0
  const historyMap = new Map<string, number>()

  transactions.forEach(txn => {
    const date = new Date(txn.transaction_date)
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    
    const amount = Number(txn.quantity) * Number(txn.price_per_unit)
    if (txn.type === 'BUY') {
      cumulativeInvestment += amount + Number(txn.brokerage_fee || 0)
    } else {
      cumulativeInvestment -= (amount - Number(txn.brokerage_fee || 0))
    }
    
    historyMap.set(monthYear, cumulativeInvestment)
  })

  const investmentHistory = Array.from(historyMap.entries()).map(([date, investment]) => ({
    date,
    investment: Math.max(0, investment)
  }))

  return (
    <AppLayout user={user} title="Performance Analytics">
      <PerformanceClient data={performanceData} historyData={investmentHistory} />
    </AppLayout>
  )
}
