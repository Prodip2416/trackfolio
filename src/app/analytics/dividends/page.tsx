import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import DividendsClient from './DividendsClient'

export const metadata = {
  title: 'Dividend Insights - TrackFolio',
}

export default async function DividendAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // 1. Fetch all dividends for the user
  const dividends = await prisma.dividends.findMany({
    where: { user_id: user.id },
    select: {
      stocks: { select: { symbol: true } },
      year: true,
      cash_amount: true,
    }
  })

  // 2. Fetch total investment to calculate overall yield
  // Aggregate total investment from active stocks
  const activeStocks = await prisma.stocks.aggregate({
    where: { 
      user_id: user.id,
      total_quantity: { gt: 0 }
    },
    _sum: {
      total_investment: true
    }
  })
  const totalInvestment = activeStocks._sum.total_investment ? Number(activeStocks._sum.total_investment) : 0

  // 3. Process data for charts
  
  // Year-on-Year Dividend Income
  const yearlyMap = new Map<number, number>()
  // Top Dividend Paying Stocks
  const stockMap = new Map<string, number>()
  
  let totalCashDividend = 0

  dividends.forEach(div => {
    const cash = div.cash_amount ? Number(div.cash_amount) : 0
    if (cash > 0) {
      totalCashDividend += cash

      // Yearly aggregation
      yearlyMap.set(div.year, (yearlyMap.get(div.year) || 0) + cash)

      // Stock aggregation
      const symbol = div.stocks?.symbol || 'Unknown'
      stockMap.set(symbol, (stockMap.get(symbol) || 0) + cash)
    }
  })

  const yearlyData = Array.from(yearlyMap.entries())
    .map(([year, amount]) => ({ year: year.toString(), amount }))
    .sort((a, b) => Number(a.year) - Number(b.year)) // Ascending chronologically

  const topStocksData = Array.from(stockMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5) // Top 5

  const overallYield = totalInvestment > 0 ? (totalCashDividend / totalInvestment) * 100 : 0

  return (
    <AppLayout user={user} title="Dividend Insights">
      <DividendsClient 
        yearlyData={yearlyData} 
        topStocksData={topStocksData} 
        totalDividend={totalCashDividend}
        totalInvestment={totalInvestment}
        overallYield={overallYield}
      />
    </AppLayout>
  )
}
