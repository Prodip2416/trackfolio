import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import GenericReportClient from '@/components/reports/GenericReportClient'

export const metadata = {
  title: 'Buy Report - TrackFolio',
}

export default async function BuyReportPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Fetch only necessary data for filters (symbols and dates)
  const txnMetadata = await prisma.transactions.findMany({
    where: { user_id: user.id, type: 'BUY' },
    select: {
      transaction_date: true,
      stocks: { select: { symbol: true } }
    }
  })

  const stockSet = new Set<string>()
  const yearSet = new Set<string>()

  txnMetadata.forEach(t => {
    if (t.stocks?.symbol) stockSet.add(t.stocks.symbol)
    yearSet.add(t.transaction_date.toISOString().substring(0, 4))
  })

  const uniqueStocks = Array.from(stockSet).sort()
  const uniqueYears = Array.from(yearSet).sort().reverse()

  return (
    <AppLayout user={user} title="Buy Report">
      <GenericReportClient 
        reportType="BUY"
        uniqueStocks={uniqueStocks} 
        uniqueYears={uniqueYears} 
      />
    </AppLayout>
  )
}
