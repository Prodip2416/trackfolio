import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import DiversificationClient from '@/components/analytics/diversification/DiversificationClient'

export const metadata = {
  title: 'Diversification Analytics - TrackFolio',
}

export default async function DiversificationAnalyticsPage() {
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
      total_investment: true,
      dse_company: { 
        select: { 
          sector: true, 
          category: true 
        } 
      },
    }
  })

  let totalPortfolioInvestment = 0
  const sectorMap = new Map<string, number>()
  const categoryMap = new Map<string, number>()
  const stockMap = new Map<string, number>()

  activeStocks.forEach(stock => {
    const investment = Number(stock.total_investment)
    if (investment <= 0) return

    totalPortfolioInvestment += investment

    // Sector Allocation
    const sector = stock.dse_company?.sector || 'Unknown'
    sectorMap.set(sector, (sectorMap.get(sector) || 0) + investment)

    // Category Allocation
    const category = stock.dse_company?.category || 'Unknown'
    categoryMap.set(category, (categoryMap.get(category) || 0) + investment)

    // Stock Allocation (Asset Concentration)
    stockMap.set(stock.symbol, (stockMap.get(stock.symbol) || 0) + investment)
  })

  // Format Data for Recharts
  const sectorData = Array.from(sectorMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const categoryData = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const topStocksData = Array.from(stockMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5) // Top 5

  return (
    <AppLayout user={user} title="Diversification Analytics">
      <DiversificationClient 
        sectorData={sectorData} 
        categoryData={categoryData} 
        topStocksData={topStocksData}
        totalInvestment={totalPortfolioInvestment}
      />
    </AppLayout>
  )
}
