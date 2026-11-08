import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalculatorClient from '@/components/planner/CalculatorClient'
import { getCalculatorHoldings, getLastCommission } from '../actions'

export const metadata = {
  title: 'What-If Calculator - TrackFolio',
}

export default async function PlannerCalculatorPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const [holdings, lastCommission] = await Promise.all([getCalculatorHoldings(), getLastCommission()])

  return <CalculatorClient holdings={holdings} defaultCommissionPct={lastCommission} />
}
