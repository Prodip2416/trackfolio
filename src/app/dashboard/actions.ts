'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePortfolioViews } from '@/lib/revalidate'
import { syncDseData } from '@/lib/sync'

export async function syncDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  try {
    const { priceError } = await syncDseData(user.id)
    revalidatePortfolioViews()
    return priceError ? { error: priceError } : { success: true }
  } catch (error) {
    console.error('Dashboard sync failed:', error)
    return { error: 'Failed to sync data. Please try again.' }
  }
}
