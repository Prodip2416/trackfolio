import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import LedgerClient from '@/components/portfolio/ledger/LedgerClient'
import { getDictionary } from '@/i18n/getDictionary'
import { getOwnedStocks, getAssetLedger } from './actions'

export const metadata = {
  title: 'Asset Ledger - TrackFolio',
}

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const params = await searchParams
  const stockId = typeof params?.stockId === 'string' ? params.stockId : 'ALL'
  const currentYear = new Date().getFullYear().toString()
  const year = typeof params?.year === 'string' ? params.year : currentYear

  const type = typeof params?.type === 'string' ? params.type : 'ALL'
  
  const dict = await getDictionary()

  const [stocksRes, ledgerRes] = await Promise.all([
    getOwnedStocks(),
    getAssetLedger(stockId, year, type)
  ])

  const stocks = stocksRes.data || []
  const initialData = ledgerRes.data || []

  return (
    <AppLayout user={user} title={dict.sidebar.assetLedger || 'Asset Ledger'}>
      <LedgerClient 
        stocks={stocks}
        initialData={initialData}
        initialStockId={stockId}
        initialYear={year}
        initialType={type}
        dict={dict}
      />
    </AppLayout>
  )
}
