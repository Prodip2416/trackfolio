import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import TransactionsClient from './TransactionsClient'
import prisma from '@/lib/prisma'

export const metadata = {
  title: 'Trade Log - TrackFolio',
}

export default async function TransactionsPage() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Fetch user's latest 10 entries across all time.
  const rawTransactions = await prisma.transactions.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' },
    take: 10,
    include: {
      stocks: {
        select: {
          symbol: true,
          dse_company: { select: { company_name: true } }
        }
      }
    }
  })

  // Format Decimal to Number
  const transactions = rawTransactions.map(tx => ({
    ...tx,
    stocks: {
      ...tx.stocks,
      company_name: tx.stocks?.dse_company?.company_name || 'Unknown'
    },
    quantity: Number(tx.quantity),
    price_per_unit: Number(tx.price_per_unit),
    brokerage_fee: tx.brokerage_fee ? Number(tx.brokerage_fee) : 0,
    transaction_date: tx.transaction_date.toISOString(),
  }))

  return (
    <AppLayout user={user} title="Trade Log">
      <TransactionsClient initialTransactions={transactions as any} />
    </AppLayout>
  )
}
