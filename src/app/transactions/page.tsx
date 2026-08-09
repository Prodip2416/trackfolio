import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import TransactionsClient from './TransactionsClient'

export const metadata = {
  title: 'Trade Log - TrackFolio',
}

export default async function TransactionsPage() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Fetch user's transactions with nested stock data
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select(`
      id, type, quantity, price_per_unit, transaction_date, brokerage_fee,
      stocks ( symbol, company_name )
    `)
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (txError) {
    console.error('Error loading transactions:', txError)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navigation user={user} />
      <TransactionsClient initialTransactions={transactions as any || []} />
    </div>
  )
}
