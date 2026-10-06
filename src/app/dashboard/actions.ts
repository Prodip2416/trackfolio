'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePortfolioViews } from '@/lib/revalidate'
import { syncDseData } from '@/lib/sync'

export async function syncDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  await syncDseData(user.id)

  revalidatePortfolioViews()
  
  return { success: true }
}
