import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/getDictionary'
import { availableYears, computeAllTime, computeYearReturn } from '@/lib/returns'
import { loadReturnsData } from '@/lib/returns-service'
import ReturnsClient from '@/components/analytics/returns/ReturnsClient'

const RANGE_FROM = 2025
const RANGE_TO = 2075

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

  // Filter offers RANGE_FROM..RANGE_TO (earlier if trades started earlier); future years are shown disabled.
  const years = availableYears(data.txns, data.today)
  const currentYear = Number(data.today.slice(0, 4))
  const range = { from: Math.min(RANGE_FROM, years.at(-1) ?? RANGE_FROM), to: Math.max(RANGE_TO, currentYear) }
  const raw = typeof params.year === 'string' ? Number(params.year) : NaN
  const selected: number | 'all' = Number.isInteger(raw) && raw >= range.from && raw <= currentYear ? raw : 'all'

  const view =
    years.length === 0
      ? { kind: 'empty' as const }
      : selected === 'all'
        ? { kind: 'all' as const, summary: computeAllTime(data) }
        : { kind: 'year' as const, result: computeYearReturn({ ...data, year: selected }) }

  return <ReturnsClient t={t} range={range} selected={selected} today={data.today} view={view} />
}
