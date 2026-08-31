import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import HistoryClient from '@/components/history/HistoryClient'

export const metadata = {
  title: 'History - TrackFolio',
}

export default async function HistoryPage() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Fetch only necessary data for filters (symbols and dates)
  const [txnMetadata, divMetadata] = await Promise.all([
    prisma.transactions.findMany({
      where: { user_id: user.id },
      select: {
        transaction_date: true,
        stocks: { select: { symbol: true } }
      }
    }),
    prisma.dividends.findMany({
      where: { user_id: user.id },
      select: {
        date: true,
        stocks: { select: { symbol: true } }
      }
    })
  ])

  // Extract unique stocks
  const stockSet = new Set<string>()
  const yearSet = new Set<string>()

  txnMetadata.forEach(t => {
    if (t.stocks?.symbol) stockSet.add(t.stocks.symbol)
    yearSet.add(t.transaction_date.toISOString().substring(0, 4))
  })

  divMetadata.forEach(d => {
    if (d.stocks?.symbol) stockSet.add(d.stocks.symbol)
    yearSet.add(d.date.toISOString().substring(0, 4))
  })

  const uniqueStocks = Array.from(stockSet).sort()
  const uniqueYears = Array.from(yearSet).sort().reverse()

  return (
    
      <HistoryClient uniqueStocks={uniqueStocks} uniqueYears={uniqueYears} />
    
  )
}
