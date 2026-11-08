import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotesClient from '@/components/planner/NotesClient'
import { getPlannerNotes } from '../actions'

export const metadata = {
  title: 'Notes & Journal - TrackFolio',
}

export default async function PlannerNotesPage({ searchParams }: { searchParams: Promise<{ focus?: string }> }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const [{ focus }, res] = await Promise.all([searchParams, getPlannerNotes()])

  if (res.error) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-sm text-red-600 dark:text-red-400">
        Could not load notes: {res.error}
      </div>
    )
  }

  return <NotesClient notes={res.data ?? []} focusId={focus} />
}
