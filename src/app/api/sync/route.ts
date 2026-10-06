import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { syncDseData } from '@/lib/sync'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { skipped } = await syncDseData(user.id)

    revalidatePath('/', 'layout')

    return NextResponse.json({ success: true, skipped })
  } catch (error) {
    console.error('Sync Error:', error)
    return NextResponse.json({ error: 'Failed to sync prices' }, { status: 500 })
  }
}
