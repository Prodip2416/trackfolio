import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/getDictionary'
import BondsClient from '@/components/prize-bond/BondsClient'
import { loadBonds } from '@/lib/prize-bond/service'
import { summarizeBonds } from '@/lib/prize-bond/winnings'

export const metadata = {
  title: 'Prize Bond - TrackFolio'
}

export default async function PrizeBondPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dict = await getDictionary()
  const bonds = await loadBonds(user.id).catch(e => {
    console.error('Prize bond page failed:', e)
    return null
  })
  if (!bonds) {
    return <div className="max-w-3xl mx-auto p-6 text-sm text-red-600 dark:text-red-400">{dict.prizeBond.errors.loadFailed}</div>
  }
  return <BondsClient bonds={bonds} summary={summarizeBonds(bonds)} t={dict.prizeBond} confirmDict={dict.confirm} />
}
