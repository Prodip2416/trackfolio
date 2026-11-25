import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/getDictionary'
import { availableYears, computeAllTime, computeYearReturn } from '@/lib/returns'
import { loadReturnsData } from '@/lib/returns-service'
import ReturnsClient from '@/components/analytics/returns/ReturnsClient'

export const metadata = {
  title: 'Yearly Return - TrackFolio'
}

export default async function YearlyReturnPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const [dict, params] = await Promise.all([getDictionary(), searchParams])
  const t = dict.returns

  const data = await loadReturnsData(user.id).catch(e => {
    console.error('Yearly Return page failed:', e)
    return null
  })
  if (!data) {
    return <div className="max-w-3xl mx-auto p-6 text-sm text-red-600 dark:text-red-400">{t.errors.loadFailed}</div>
  }

  const years = availableYears(data.txns, data.today)
  const raw = typeof params.year === 'string' ? Number(params.year) : NaN
  const selected: number | 'all' = years.includes(raw) ? raw : 'all'

  const view =
    years.length === 0
      ? { kind: 'empty' as const }
      : selected === 'all'
        ? { kind: 'all' as const, summary: computeAllTime(data) }
        : { kind: 'year' as const, result: computeYearReturn({ ...data, year: selected }) }

  return <ReturnsClient t={t} years={years} selected={selected} today={data.today} view={view} />
}
