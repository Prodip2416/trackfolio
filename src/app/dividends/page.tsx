import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import DividendsClient from './DividendsClient'
import prisma from '@/lib/prisma'

export const metadata = {
  title: 'Dividend Log - TrackFolio',
}

export default async function DividendsPage() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

    // Fetch user's latest 10 entries across all time.
    const rawDividends = await prisma.dividends.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      take: 10,
    include: {
      stocks: {
        select: {
          symbol: true,
          dse_company: { select: { company_name: true } }
        }
      }
    }
  })

  // Format Decimal values
  const dividends = rawDividends.map(div => ({
    ...div,
    stocks: {
      ...div.stocks,
      company_name: div.stocks?.dse_company?.company_name || 'Unknown'
    },
    percentage: div.percentage ? Number(div.percentage) : null,
    cash_amount: div.cash_amount ? Number(div.cash_amount) : null,
    bonus_quantity: div.bonus_quantity ? Number(div.bonus_quantity) : null,
    date: div.date.toISOString(),
  }))

  return (
    <AppLayout user={user} title="Dividend Log">
      <DividendsClient initialDividends={dividends as any} />
    </AppLayout>
  )
}
