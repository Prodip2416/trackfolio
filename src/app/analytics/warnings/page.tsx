import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import WarningsClient from './WarningsClient'

export const metadata = {
  title: 'Risk Warnings - TrackFolio',
}

export default async function WarningsAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch all active stocks in portfolio
  const stocks = await prisma.stocks.findMany({
    where: { 
      user_id: user.id,
      total_quantity: { gt: 0 }
    },
    select: {
      symbol: true,
      total_investment: true,
      portfolio_price: true,
    }
  })

  let totalPortfolioInvestment = 0
  let totalPortfolioValue = 0

  stocks.forEach(stock => {
    totalPortfolioInvestment += Number(stock.total_investment)
    totalPortfolioValue += Number(stock.portfolio_price)
  })

  // Calculate Exposure Data
  // We consider an exposure "high risk" if it exceeds 20% of the total portfolio investment
  const RISK_THRESHOLD_PERCENT = 20
  const exposures: any[] = []

  stocks.forEach(stock => {
    const investment = Number(stock.total_investment)
    if (totalPortfolioInvestment > 0) {
      const percentage = (investment / totalPortfolioInvestment) * 100
      
      // Store all to show a top exposure list, but we'll flag >20%
      exposures.push({
        symbol: stock.symbol,
        investment: investment,
        percentage: percentage,
        isHighRisk: percentage >= RISK_THRESHOLD_PERCENT
      })
    }
  })

  // Sort by highest exposure
  exposures.sort((a, b) => b.percentage - a.percentage)

  return (
    <AppLayout user={user} title="Risk Warnings">
      <WarningsClient 
        exposures={exposures}
        totalInvestment={totalPortfolioInvestment}
        riskThreshold={RISK_THRESHOLD_PERCENT}
      />
    </AppLayout>
  )
}
