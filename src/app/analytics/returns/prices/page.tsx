import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/getDictionary'
import { availableYears, canEditYearEndPrice, isStalePrice, priceKey, requiredYearEndPrices } from '@/lib/returns'
import { loadReturnsData } from '@/lib/returns-service'
import YearEndPricesClient, { type PriceRow } from '@/components/analytics/returns/YearEndPricesClient'

export const metadata = {
  title: 'Year-end Prices - TrackFolio'
}

export default async function YearEndPricesPage({
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
    console.error('Year-end Prices page failed:', e)
    return null
  })
  if (!data) {
    return <div className="max-w-3xl mx-auto p-6 text-sm text-red-600 dark:text-red-400">{t.errors.loadFailed}</div>
  }

  // Only finished years need a stored price; the running year uses the live price.
  const currentYear = Number(data.today.slice(0, 4))
  const years = availableYears(data.txns, data.today).filter(y => y < currentYear)
  const raw = typeof params.year === 'string' ? Number(params.year) : NaN
  const year = years.includes(raw) ? raw : (years[0] ?? null)

  const rows: PriceRow[] =
    year === null
      ? []
      : requiredYearEndPrices(data.txns, data.dividends, year).map(({ symbol, qty }) => {
          const p = data.prices.yearEnd.get(priceKey(symbol, year))
          return {
            symbol,
            qty,
            price: p?.price ?? null,
            priceDate: p?.priceDate ?? null,
            source: p?.source ?? null,
            status: !p ? 'missing' : isStalePrice(p, year) ? 'stale' : 'ok',
            editable: canEditYearEndPrice(p, year)
          }
        })

  return <YearEndPricesClient t={t} years={years} year={year} rows={rows} />
}
