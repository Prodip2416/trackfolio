import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import WatchlistClient from './WatchlistClient'
import { getWatchlist } from './actions'
import { getDictionary } from '@/i18n/getDictionary'

export const metadata = {
  title: 'Watchlist - TrackFolio',
}

export default async function WatchlistPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const dict = await getDictionary()
  const watchlistRes = await getWatchlist()
  const watchlist = watchlistRes.data || []

  return (
    <AppLayout user={user} title={dict.sidebar.watchlist || 'Watchlist'}>
      <WatchlistClient initialWatchlist={watchlist} dict={dict} />
    </AppLayout>
  )
}