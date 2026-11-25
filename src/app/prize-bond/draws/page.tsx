import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/getDictionary'
import DrawCheckClient from '@/components/prize-bond/DrawCheckClient'
import prisma from '@/lib/prisma'

export const metadata = {
  title: 'Draw Check - TrackFolio'
}

export default async function DrawCheckPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dict = await getDictionary()
  const bondCount = await prisma.prize_bonds.count({ where: { user_id: user.id } }).catch(() => 0)
  return <DrawCheckClient bondCount={bondCount} t={dict.prizeBond} />
}
