import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import PortfolioClient from './PortfolioClient'
import { getDictionary } from '@/i18n/getDictionary'

export const metadata = {
  title: 'Portfolio - TrackFolio',
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const params = await searchParams
  const pageStr = params?.page
  const currentPage = typeof pageStr === 'string' ? parseInt(pageStr, 10) : 1
  const limit = 10
  const skip = (currentPage - 1) * limit

  const dict = await getDictionary()

  // 1. Get global aggregates for the top card (Total Investment & Count)
  const globalAggregates = await prisma.stocks.aggregate({
    where: { 
      user_id: user.id,
      total_quantity: { gt: 0 }
    },
    _sum: {
      total_investment: true
    },
    _count: {
      id: true
    }
  })

  const globalTotalInvestment = globalAggregates._sum.total_investment ? Number(globalAggregates._sum.total_investment) : 0
  const globalActiveStocksCount = globalAggregates._count.id

  const totalPages = Math.ceil(globalActiveStocksCount / limit)

  // 2. Fetch paginated stocks for the table
  const activeStocks = await prisma.stocks.findMany({
    where: { 
      user_id: user.id,
      total_quantity: { gt: 0 }
    },
    select: {
      id: true,
      symbol: true,
      dse_company: { select: { company_name: true, category: true, current_price: true } },
      total_quantity: true,
      average_buy_price: true,
      portfolio_price: true,
      total_investment: true,
      updated_at: true,
    },
    orderBy: {
      symbol: 'asc'
    },
    skip,
    take: limit
  })

  // Format Decimal to Number for Client Component
  const formattedStocks = activeStocks.map(stock => {
    const { dse_company, ...rest } = stock;
    return {
      ...rest,
      company_name: dse_company?.company_name || 'Unknown',
      category: dse_company?.category || 'N/A',
      latest_price: dse_company?.current_price ? Number(dse_company.current_price) : 0,
      total_quantity: Number(stock.total_quantity),
      average_buy_price: Number(stock.average_buy_price),
      portfolio_price: Number(stock.portfolio_price),
      total_investment: Number(stock.total_investment),
      updated_at: stock.updated_at ? stock.updated_at.toISOString() : new Date().toISOString(),
    }
  })

  return (
    <AppLayout user={user} title={dict.sidebar.portfolio}>
      <PortfolioClient 
        stocks={formattedStocks} 
        currentPage={currentPage}
        totalPages={totalPages}
        globalTotalInvestment={globalTotalInvestment}
        globalActiveStocksCount={globalActiveStocksCount}
        dict={dict}
      />
    </AppLayout>
  )
}
