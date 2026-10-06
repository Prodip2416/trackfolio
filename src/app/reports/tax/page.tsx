import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import TaxReportClient from '@/components/reports/tax/TaxReportClient'
import { getDictionary } from '@/i18n/getDictionary'
import { cookies } from 'next/headers'
import { computeHoldingTimeline } from '@/lib/stock-aggregates'

export const metadata = {
  title: 'Tax & Capital Gain Report - TrackFolio',
}

function getFinancialYear(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth() // 0-11, 6 is July
  if (month >= 6) {
    return `${year}-${year + 1}`
  } else {
    return `${year - 1}-${year}`
  }
}

export default async function TaxReportPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch all transactions; ordering is handled by computeHoldingTimeline
  const transactions = await prisma.transactions.findMany({
    where: { user_id: user.id },
    select: {
      id: true,
      stock_id: true,
      type: true,
      quantity: true,
      price_per_unit: true,
      brokerage_fee: true,
      transaction_date: true,
      created_at: true,
      stocks: {
        select: { symbol: true }
      }
    }
  })

  // Fetch all dividends (bonus shares affect cost per unit)
  const dividends = await prisma.dividends.findMany({
    where: { user_id: user.id },
    orderBy: { date: 'asc' },
    select: {
      id: true,
      stock_id: true,
      cash_amount: true,
      bonus_quantity: true,
      date: true,
      created_at: true,
      stocks: {
        select: { symbol: true }
      }
    }
  })

  // Group Dividends by Financial Year
  // Format: Record<FinancialYear, Array<DividendItem>>
  const dividendsByFY: Record<string, any[]> = {}
  
  dividends.forEach(div => {
    if (!div.cash_amount || !div.stocks) return
    const fy = getFinancialYear(new Date(div.date))
    if (!dividendsByFY[fy]) dividendsByFY[fy] = []
    
    dividendsByFY[fy].push({
      symbol: div.stocks.symbol,
      date: div.date.toISOString(),
      amount: Number(div.cash_amount)
    })
  })

  // Group Capital Gains by Financial Year
  // Realized Gain uses the same Weighted Average Cost (incl. bonus shares) as the portfolio
  const capitalGainsByFY: Record<string, any[]> = {}

  const byStock = new Map<string, { symbol: string, txns: typeof transactions, divs: typeof dividends }>()
  for (const txn of transactions) {
    if (!txn.stock_id || !txn.stocks) continue
    if (!byStock.has(txn.stock_id)) byStock.set(txn.stock_id, { symbol: txn.stocks.symbol, txns: [], divs: [] })
    byStock.get(txn.stock_id)!.txns.push(txn)
  }
  for (const div of dividends) {
    if (div.stock_id) byStock.get(div.stock_id)?.divs.push(div)
  }

  for (const { symbol, txns, divs } of byStock.values()) {
    const { realizedSells } = computeHoldingTimeline(txns, divs)
    for (const sell of realizedSells) {
      const fy = getFinancialYear(sell.date)
      if (!capitalGainsByFY[fy]) capitalGainsByFY[fy] = []
      capitalGainsByFY[fy].push({
        ...sell,
        symbol,
        date: sell.date.toISOString()
      })
    }
  }

  // Keep entries chronological within each FY
  for (const fy of Object.keys(capitalGainsByFY)) {
    capitalGainsByFY[fy].sort((a, b) => a.date.localeCompare(b.date))
  }

  // Determine all available Financial Years to populate the Dropdown
  const availableYears = Array.from(new Set([
    ...Object.keys(dividendsByFY),
    ...Object.keys(capitalGainsByFY)
  ])).sort((a, b) => b.localeCompare(a)) // Sort descending (e.g. 2026-2027 before 2025-2026)

  // If completely empty, just provide the current FY
  if (availableYears.length === 0) {
    availableYears.push(getFinancialYear(new Date()))
  }

  const dict = await getDictionary()

  return (
    
      <TaxReportClient 
        availableYears={availableYears}
        dividendsByFY={dividendsByFY}
        capitalGainsByFY={capitalGainsByFY}
        dict={dict}
      />
    
  )
}
