import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import DashboardClient from '@/components/dashboard/DashboardClient'

export const metadata = {
  title: 'Dashboard - TrackFolio',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Fetch all transactions to build the dashboard
  const [transactions, dividends, companies] = await Promise.all([
    prisma.transactions.findMany({
      where: { user_id: user.id },
      select: {
        id: true,
        type: true,
        quantity: true,
        price_per_unit: true,
        transaction_date: true,
        brokerage_fee: true,
        stocks: {
          select: { symbol: true, dse_company: { select: { company_name: true, sector: true, current_price: true } } }
        }
      }
    }),
    prisma.dividends.findMany({
      where: { user_id: user.id },
      select: {
        id: true,
        type: true,
        cash_amount: true,
        bonus_quantity: true,
        date: true,
        stocks: {
          select: { symbol: true, dse_company: { select: { company_name: true, sector: true } } }
        }
      }
    }),
    prisma.dse_companies.findMany({
      select: { symbol: true, sector: true }
    })
  ])

  // Create a map for fast sector lookups from dse_companies
  const sectorMap = new Map<string, string>()
  companies.forEach(c => {
    if (c.sector) {
      sectorMap.set(c.symbol, c.sector)
    }
  })

  // Format data to pass to Client Component (convert Decimal to Number)
  const formattedTransactions = transactions.map(t => ({
    ...t,
    quantity: Number(t.quantity),
    price_per_unit: Number(t.price_per_unit),
    brokerage_fee: t.brokerage_fee ? Number(t.brokerage_fee) : 0,
    transaction_date: t.transaction_date.toISOString(),
    stocks: {
      symbol: t.stocks?.symbol || '',
      company_name: t.stocks?.dse_company?.company_name || 'Unknown',
      sector: sectorMap.get(t.stocks?.symbol || '') || t.stocks?.dse_company?.sector || 'Others',
      current_price: t.stocks?.dse_company?.current_price ? Number(t.stocks.dse_company.current_price) : null
    }
  }))

  const formattedDividends = dividends.map(d => ({
    ...d,
    cash_amount: d.cash_amount ? Number(d.cash_amount) : null,
    bonus_quantity: d.bonus_quantity ? Number(d.bonus_quantity) : null,
    date: d.date.toISOString(),
    stocks: {
      symbol: d.stocks?.symbol || '',
      company_name: d.stocks?.dse_company?.company_name || 'Unknown',
      sector: sectorMap.get(d.stocks?.symbol || '') || d.stocks?.dse_company?.sector || 'Others'
    }
  }))

  return (
    <AppLayout user={user} title="Dashboard">
      <DashboardClient transactions={formattedTransactions as any} dividends={formattedDividends as any} />
    </AppLayout>
  )
}
