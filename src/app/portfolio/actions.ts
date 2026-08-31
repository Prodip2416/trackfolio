'use server'

import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function getStockHistory(stockId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const [transactions, dividends] = await Promise.all([
    prisma.transactions.findMany({
      where: { user_id: user.id, stock_id: stockId },
      orderBy: { transaction_date: 'desc' }
    }),
    prisma.dividends.findMany({
      where: { user_id: user.id, stock_id: stockId },
      orderBy: { date: 'desc' }
    })
  ])

  // Combine and sort by date desc
  const history = [
    ...transactions.map(t => ({
      id: t.id,
      type: t.type, // 'BUY' | 'SELL'
      date: t.transaction_date.toISOString(),
      quantity: Number(t.quantity),
      price: Number(t.price_per_unit),
      fee: Number(t.brokerage_fee || 0),
      total: (t.type === 'BUY' 
        ? (Number(t.quantity) * Number(t.price_per_unit) + Number(t.brokerage_fee || 0))
        : (Number(t.quantity) * Number(t.price_per_unit) - Number(t.brokerage_fee || 0)))
    })),
    ...dividends.map(d => ({
      id: d.id,
      type: 'DIVIDEND',
      date: d.date.toISOString(),
      quantity: d.bonus_quantity ? Number(d.bonus_quantity) : 0,
      price: 0,
      fee: 0,
      total: d.cash_amount ? Number(d.cash_amount) : 0
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return history
}
