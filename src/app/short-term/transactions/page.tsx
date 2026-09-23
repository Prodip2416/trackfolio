import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import ShortTermClient from '@/components/short-term/ShortTermClient'
import { getShortTermTrades, getOwnedShortTermSymbols } from '../actions'

export const metadata = {
  title: 'Short Term Transactions - TrackFolio',
}

export default async function ShortTermTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const params = await searchParams
  const currentYear = new Date().getFullYear().toString()
  const symbol = typeof params?.symbol === 'string' ? params.symbol : 'ALL'
  const year = typeof params?.year === 'string' ? params.year : currentYear

  // Fetch all DSE symbols for the "Log Trade" modal
  const dseCompanies = await prisma.dse_companies.findMany({
    select: { symbol: true },
    orderBy: { symbol: 'asc' },
  })

  const availableSymbols = dseCompanies.map(c => c.symbol)
  const [filterSymbols, trades] = await Promise.all([
    getOwnedShortTermSymbols(),
    getShortTermTrades(symbol, year)
  ])

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900 rounded-tl-2xl border-t border-l border-gray-200 dark:border-gray-800 transition-colors">
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <ShortTermClient
          trades={trades}
          availableSymbols={availableSymbols}
          filterSymbols={filterSymbols}
          initialSymbol={symbol}
          initialYear={year}
        />
      </main>
    </div>
  )
}
