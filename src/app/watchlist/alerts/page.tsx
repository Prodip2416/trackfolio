import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PriceAlertsClient from '@/components/watchlist/alerts/PriceAlertsClient'
import { getPriceAlerts, getWatchlistSymbols } from '../actions'
import { getDictionary } from '@/i18n/getDictionary'

export const metadata = {
  title: 'Price Alerts - TrackFolio',
}

export default async function PriceAlertsPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const dict = await getDictionary()
  const [alertsRes, symbolsRes] = await Promise.all([
    getPriceAlerts(),
    getWatchlistSymbols()
  ])

  const alerts = alertsRes.data || []
  const symbols = symbolsRes.data || []

  return (
    
      <PriceAlertsClient initialAlerts={alerts} watchlistSymbols={symbols} dict={dict} />
    
  )
}