import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import HistoryClient from './HistoryClient'

export const metadata = {
  title: 'History - TrackFolio',
}

export default async function HistoryPage() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Fetch all transactions for history
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
    console.error('Error loading history transactions:', txError)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navigation user={user} />
      <HistoryClient transactions={transactions as any || []} />
    </div>
  )
}
