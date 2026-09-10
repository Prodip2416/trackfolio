import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import ShortTermClient from '@/components/short-term/ShortTermClient'
import { getShortTermTrades } from './actions'

export const metadata = {
  title: 'Short Term Trades - TrackFolio',
}

export default async function ShortTermPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch all DSE symbols for the dropdown
  const dseCompanies = await prisma.dse_companies.findMany({
    select: { symbol: true },
    orderBy: { symbol: 'asc' },
  })
  
  const symbols = dseCompanies.map(c => c.symbol)
  const trades = await getShortTermTrades()

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900 rounded-tl-2xl border-t border-l border-gray-200 dark:border-gray-800 transition-colors">
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <ShortTermClient trades={trades} availableSymbols={symbols} />
      </main>
    </div>
  )
}
