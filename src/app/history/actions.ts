'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export async function getHistoryData({
  activeTab,
  filterStock,
  filterYear,
  filterStartDate,
  filterEndDate,
  currentPage,
  itemsPerPage = 10,
}: {
  activeTab: 'BUY' | 'SELL' | 'DIVIDEND'
  filterStock: string
  filterYear: string
  filterStartDate: string
  filterEndDate: string
  currentPage: number
  itemsPerPage?: number
}) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Unauthorized')
  }

  const skip = (currentPage - 1) * itemsPerPage

  if (activeTab === 'DIVIDEND') {
    // Base WHERE clause
    const whereClause: any = {
      user_id: user.id,
    }

    if (filterStock !== 'ALL') {
      whereClause.stocks = { symbol: filterStock }
    }

    // Build Date condition
    const dateCondition: any = {}
    
    // If year is selected, the date must start with that year
    // For Prisma, we can use `gte` and `lt` for the year boundaries if it's a DateTime field
    if (filterYear !== 'ALL') {
      dateCondition.gte = new Date(`${filterYear}-01-01T00:00:00.000Z`)
      dateCondition.lt = new Date(`${parseInt(filterYear) + 1}-01-01T00:00:00.000Z`)
    }
    
    if (filterStartDate) {
      const startDate = new Date(`${filterStartDate}T00:00:00.000Z`)
      if (!dateCondition.gte || startDate > dateCondition.gte) {
        dateCondition.gte = startDate
      }
    }
    
    if (filterEndDate) {
      const endDate = new Date(`${filterEndDate}T23:59:59.999Z`)
      if (!dateCondition.lte || endDate < dateCondition.lte) {
        dateCondition.lte = endDate
      }
    }

    if (Object.keys(dateCondition).length > 0) {
      whereClause.date = dateCondition
    }

    // 1. Get total records count
    const totalRecords = await prisma.dividends.count({ where: whereClause })
    
    // 2. Fetch all matching for current total calculation
    // Optimization: only fetch cash_amount
    const allMatching = await prisma.dividends.findMany({
      where: whereClause,
      select: { cash_amount: true }
    })
    
    const currentTotal = allMatching.reduce((acc, curr) => {
      return acc + (curr.cash_amount ? Number(curr.cash_amount) : 0)
    }, 0)

    // 3. Fetch paginated data
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
      ],
      skip,
      take: itemsPerPage
    })

    const formattedDividends = dividends.map(d => ({
      ...d,
      stocks: {
        symbol: d.stocks?.symbol || '',
        company_name: d.stocks?.dse_company?.company_name || 'Unknown'
      },
      cash_amount: d.cash_amount ? Number(d.cash_amount) : null,
      bonus_quantity: d.bonus_quantity ? Number(d.bonus_quantity) : null,
      date: d.date.toISOString(),
    }))

    return {
      data: formattedDividends,
      totalRecords,
      totalPages: Math.max(1, Math.ceil(totalRecords / itemsPerPage)),
      currentTotal
    }

  } else {
    // Base WHERE clause for Transactions
    const whereClause: any = {
      user_id: user.id,
      type: activeTab
    }

    if (filterStock !== 'ALL') {
      whereClause.stocks = { symbol: filterStock }
    }

    // Build Date condition
    const dateCondition: any = {}
    
    if (filterYear !== 'ALL') {
      dateCondition.gte = new Date(`${filterYear}-01-01T00:00:00.000Z`)
      dateCondition.lt = new Date(`${parseInt(filterYear) + 1}-01-01T00:00:00.000Z`)
    }
    
    if (filterStartDate) {
      const startDate = new Date(`${filterStartDate}T00:00:00.000Z`)
      if (!dateCondition.gte || startDate > dateCondition.gte) {
        dateCondition.gte = startDate
      }
    }
    
    if (filterEndDate) {
      const endDate = new Date(`${filterEndDate}T23:59:59.999Z`)
      if (!dateCondition.lte || endDate < dateCondition.lte) {
        dateCondition.lte = endDate
      }
    }

    if (Object.keys(dateCondition).length > 0) {
      whereClause.transaction_date = dateCondition
    }

    // 1. Get total records count
    const totalRecords = await prisma.transactions.count({ where: whereClause })
    
    // 2. Fetch all matching for current total calculation
    const allMatching = await prisma.transactions.findMany({
      where: whereClause,
      select: { 
        quantity: true,
        price_per_unit: true,
        brokerage_fee: true,
        type: true
      }
    })
    
    const currentTotal = allMatching.reduce((acc, txn) => {
      const qty = Number(txn.quantity)
      const price = Number(txn.price_per_unit)
      const fee = txn.brokerage_fee ? Number(txn.brokerage_fee) : 0
      const value = qty * price
      
      if (txn.type === 'BUY') {
        return acc + value + fee
      } else {
        return acc + value - fee
      }
    }, 0)

    // 3. Fetch paginated data
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
      ],
      skip,
      take: itemsPerPage
    })

    const formattedTransactions = transactions.map(t => ({
      ...t,
      stocks: {
        symbol: t.stocks?.symbol || '',
        company_name: t.stocks?.dse_company?.company_name || 'Unknown'
      },
      quantity: Number(t.quantity),
      price_per_unit: Number(t.price_per_unit),
      brokerage_fee: t.brokerage_fee ? Number(t.brokerage_fee) : 0,
      transaction_date: t.transaction_date.toISOString(),
    }))

    return {
      data: formattedTransactions,
      totalRecords,
      totalPages: Math.max(1, Math.ceil(totalRecords / itemsPerPage)),
      currentTotal
    }
  }
}
