'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export async function getFilteredReportData({
  reportType,
  filterStock,
  filterYear
}: {
  reportType: 'BUY' | 'SELL' | 'DIVIDEND'
  filterStock: string
  filterYear: string
}) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Unauthorized')
  }

  if (reportType === 'DIVIDEND') {
    const whereClause: any = { user_id: user.id }

    if (filterStock !== 'ALL') {
      whereClause.stocks = { symbol: filterStock }
    }

    if (filterYear !== 'ALL') {
      const dateCondition: any = {}
      dateCondition.gte = new Date(`${filterYear}-01-01T00:00:00.000Z`)
      dateCondition.lt = new Date(`${parseInt(filterYear) + 1}-01-01T00:00:00.000Z`)
      whereClause.date = dateCondition
    }

    const dividends = await prisma.dividends.findMany({
      where: whereClause,
      select: {
        id: true,
        type: true,
        cash_amount: true,
        bonus_quantity: true,
        date: true,
        stocks: {
          select: { symbol: true, dse_company: { select: { company_name: true } } }
        }
      },
      orderBy: [
        { date: 'desc' },
        { created_at: 'desc' }
      ]
    })

    return dividends.map(d => ({
      id: d.id,
      symbol: d.stocks?.symbol || '',
      company_name: d.stocks?.dse_company?.company_name || 'Unknown',
      date: d.date.toISOString(),
      type: d.type,
      cash_amount: d.cash_amount ? Number(d.cash_amount) : null,
      bonus_quantity: d.bonus_quantity ? Number(d.bonus_quantity) : null,
    }))

  } else {
    // BUY or SELL
    const whereClause: any = {
      user_id: user.id,
      type: reportType
    }

    if (filterStock !== 'ALL') {
      whereClause.stocks = { symbol: filterStock }
    }

    if (filterYear !== 'ALL') {
      const dateCondition: any = {}
      dateCondition.gte = new Date(`${filterYear}-01-01T00:00:00.000Z`)
      dateCondition.lt = new Date(`${parseInt(filterYear) + 1}-01-01T00:00:00.000Z`)
      whereClause.transaction_date = dateCondition
    }

    const transactions = await prisma.transactions.findMany({
      where: whereClause,
      select: {
        id: true,
        type: true,
        quantity: true,
        price_per_unit: true,
        transaction_date: true,
        brokerage_fee: true,
        stocks: {
          select: { symbol: true, dse_company: { select: { company_name: true } } }
        }
      },
      orderBy: [
        { transaction_date: 'desc' },
        { created_at: 'desc' }
      ]
    })

    return transactions.map(t => ({
      id: t.id,
      symbol: t.stocks?.symbol || '',
      company_name: t.stocks?.dse_company?.company_name || 'Unknown',
      date: t.transaction_date.toISOString(),
      type: t.type,
      quantity: Number(t.quantity),
      price_per_unit: Number(t.price_per_unit),
      brokerage_fee: t.brokerage_fee ? Number(t.brokerage_fee) : 0,
    }))
  }
}
