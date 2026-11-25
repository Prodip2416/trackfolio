import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/getDictionary'
import WinningsClient from '@/components/prize-bond/WinningsClient'
import { loadWins } from '@/lib/prize-bond/service'

export const metadata = {
  title: 'Prize Bond Winnings - TrackFolio'
}

export default async function WinningsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dict = await getDictionary()
  const wins = await loadWins(user.id).catch(e => {
    console.error('Winnings page failed:', e)
    return null
  })
  if (!wins) {
    return <div className="max-w-3xl mx-auto p-6 text-sm text-red-600 dark:text-red-400">{dict.prizeBond.errors.loadFailed}</div>
  }
  return <WinningsClient wins={wins} t={dict.prizeBond} confirmDict={dict.confirm} />
}
