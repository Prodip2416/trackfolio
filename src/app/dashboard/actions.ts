'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { syncDseData } from '@/lib/sync'

export async function syncDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  await syncDseData(user.id)

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/portfolio')
  
  return { success: true }
}
