import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import GenericReportClient from '@/components/reports/GenericReportClient'

export const metadata = {
  title: 'Dividend Report - TrackFolio',
}

export default async function DividendReportPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Fetch only necessary data for filters (symbols and dates)
  const divMetadata = await prisma.dividends.findMany({
    where: { user_id: user.id },
    select: {
      date: true,
      stocks: { select: { symbol: true } }
    }
  })

  const stockSet = new Set<string>()
  const yearSet = new Set<string>()

  divMetadata.forEach(d => {
    if (d.stocks?.symbol) stockSet.add(d.stocks.symbol)
    yearSet.add(d.date.toISOString().substring(0, 4))
  })

  const uniqueStocks = Array.from(stockSet).sort()
  const uniqueYears = Array.from(yearSet).sort().reverse()

  return (
    <AppLayout user={user} title="Dividend Report">
      <GenericReportClient 
        reportType="DIVIDEND"
        uniqueStocks={uniqueStocks} 
        uniqueYears={uniqueYears} 
      />
    </AppLayout>
  )
}
