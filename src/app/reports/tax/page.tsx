import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import TaxReportClient from './TaxReportClient'

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

  // Fetch all transactions, ordered chronologically to calculate Weighted Average Cost
  const transactions = await prisma.transactions.findMany({
    where: { user_id: user.id },
    orderBy: { transaction_date: 'asc' },
    select: {
      id: true,
      type: true,
      quantity: true,
      price_per_unit: true,
      brokerage_fee: true,
      transaction_date: true,
      stocks: {
        select: { symbol: true }
      }
    }
  })

  // Fetch all dividends
  const dividends = await prisma.dividends.findMany({
    where: { user_id: user.id },
    orderBy: { date: 'asc' },
    select: {
      id: true,
      cash_amount: true,
      date: true,
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
  // We need to calculate Realized Gain using Weighted Average Cost
  const capitalGainsByFY: Record<string, any[]> = {}
  
  // Track inventory state per stock symbol
  // Record<Symbol, { qty: number, totalCost: number }>
  const inventory: Record<string, { qty: number, totalCost: number }> = {}

  transactions.forEach(txn => {
    if (!txn.stocks) return
    const symbol = txn.stocks.symbol
    if (!inventory[symbol]) {
      inventory[symbol] = { qty: 0, totalCost: 0 }
    }
    
    const qty = Number(txn.quantity)
    const price = Number(txn.price_per_unit)
    const fee = Number(txn.brokerage_fee || 0)
    const date = new Date(txn.transaction_date)
    const fy = getFinancialYear(date)

    if (txn.type === 'BUY') {
      // Add to inventory
      inventory[symbol].qty += qty
      inventory[symbol].totalCost += (qty * price) + fee
    } else if (txn.type === 'SELL') {
      // Calculate Realized Gain
      const currentQty = inventory[symbol].qty
      const currentCost = inventory[symbol].totalCost
      
      let costPerUnit = 0
      if (currentQty > 0) {
        costPerUnit = currentCost / currentQty
      }

      // Cost of Goods Sold (COGS)
      const costOfSoldShares = costPerUnit * qty
      
      // Net Sell Value
      const netSellValue = (qty * price) - fee
      
      // Realized Gain = Net Sell - COGS
      const realizedGain = netSellValue - costOfSoldShares

      // Deduct from inventory
      inventory[symbol].qty = Math.max(0, currentQty - qty)
      inventory[symbol].totalCost = Math.max(0, currentCost - costOfSoldShares)

      // Record this gain in the respective Financial Year
      if (!capitalGainsByFY[fy]) capitalGainsByFY[fy] = []
      
      capitalGainsByFY[fy].push({
        id: txn.id,
        symbol: symbol,
        date: date.toISOString(),
        qtySold: qty,
        sellValue: netSellValue,
        costValue: costOfSoldShares,
        realizedGain: realizedGain
      })
    }
  })

  // Determine all available Financial Years to populate the Dropdown
  const availableYears = Array.from(new Set([
    ...Object.keys(dividendsByFY),
    ...Object.keys(capitalGainsByFY)
  ])).sort((a, b) => b.localeCompare(a)) // Sort descending (e.g. 2026-2027 before 2025-2026)

  // If completely empty, just provide the current FY
  if (availableYears.length === 0) {
    availableYears.push(getFinancialYear(new Date()))
  }

  return (
    <AppLayout user={user} title="Tax & Capital Gain Report">
      <TaxReportClient 
        availableYears={availableYears}
        dividendsByFY={dividendsByFY}
        capitalGainsByFY={capitalGainsByFY}
      />
    </AppLayout>
  )
}
