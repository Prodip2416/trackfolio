import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TradePlanClient from '@/components/planner/TradePlanClient'
import { getTradePlans } from './actions'

export const metadata = {
  title: 'Trade Plan - TrackFolio',
}

export default async function TradePlanPage({ searchParams }: { searchParams: Promise<{ focus?: string }> }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const [{ focus }, res] = await Promise.all([searchParams, getTradePlans()])

  if (res.error) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-sm text-red-600 dark:text-red-400">
        Could not load plans: {res.error}
      </div>
    )
  }

  return <TradePlanClient plans={res.data ?? []} lastCommissionPct={res.lastCommissionPct ?? 0} focusId={focus} />
}
