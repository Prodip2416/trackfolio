'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export async function getOwnedStocks() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const rawOwnedStocks = await prisma.stocks.findMany({
      where: { user_id: user.id },
      select: {
        id: true,
        symbol: true,
        dse_company: { select: { company_name: true } }
      },
      distinct: ['symbol']
    })
    
    const ownedStocks = rawOwnedStocks.map(stock => ({
      id: stock.id,
      symbol: stock.symbol,
      company_name: stock.dse_company?.company_name || 'Unknown'
    }))
    
    return { data: ownedStocks }
  } catch (error) {
    console.error('Error fetching owned stocks:', error)
    return { error: 'Failed to fetch owned stocks.' }
  }
}

export async function getAssetLedger(stockId?: string, year?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    let transactionWhere: any = { user_id: user.id }
    let dividendWhere: any = { user_id: user.id }

    if (stockId && stockId !== 'ALL') {
      transactionWhere.stock_id = stockId
      dividendWhere.stock_id = stockId
    }

    if (year && year !== 'ALL') {
      const yearNum = parseInt(year)
      const startDate = new Date(`${yearNum}-01-01T00:00:00.000Z`)
      const endDate = new Date(`${yearNum}-12-31T23:59:59.999Z`)
      
      transactionWhere.transaction_date = {
        gte: startDate,
        lte: endDate
      }
      // Dividends have both a date and a year column in the db. 
      // We will filter by the 'year' column for simplicity as per existing logic, or date.
      dividendWhere.year = yearNum
    }

    // Fetch transactions
    const rawTransactions = await prisma.transactions.findMany({
      where: transactionWhere,
      include: {
        stocks: {
          include: {
            dse_company: true
          }
        }
      }
    })

    // Fetch dividends
    const rawDividends = await prisma.dividends.findMany({
      where: dividendWhere,
      include: {
        stocks: {
          include: {
            dse_company: true
          }
        }
      }
    })

    // Normalize Data
    const normalizedTransactions = rawTransactions.map(t => ({
      id: t.id,
      date: t.transaction_date.toISOString(),
      type: t.type, // 'BUY' | 'SELL'
      symbol: t.stocks?.symbol || 'Unknown',
      company_name: t.stocks?.dse_company?.company_name || 'Unknown',
      quantity: Number(t.quantity),
      price_per_unit: Number(t.price_per_unit),
      total: Number(t.quantity) * Number(t.price_per_unit)
    }))

    const normalizedDividends = rawDividends.map(d => ({
      id: d.id,
      date: d.date.toISOString(),
      type: 'DIVIDEND',
      symbol: d.stocks?.symbol || 'Unknown',
      company_name: d.stocks?.dse_company?.company_name || 'Unknown',
      quantity: d.bonus_quantity ? Number(d.bonus_quantity) : 0,
      price_per_unit: null,
      total: d.cash_amount ? Number(d.cash_amount) : 0
    }))

    // Combine and sort by date descending
    const combinedLedger = [...normalizedTransactions, ...normalizedDividends].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    return { data: combinedLedger }
  } catch (error) {
    console.error('Error fetching asset ledger:', error)
    return { error: 'Failed to fetch asset ledger.' }
  }
}
