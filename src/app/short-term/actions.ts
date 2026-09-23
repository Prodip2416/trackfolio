'use server'

import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getOwnedShortTermSymbols() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')

  const trades = await prisma.short_term_trades.findMany({
    where: { user_id: user.id },
    select: { symbol: true },
    distinct: ['symbol'],
    orderBy: { symbol: 'asc' }
  })

  return trades.map(t => t.symbol)
}

export async function getShortTermTrades(symbol?: string, year?: string) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')

  const where: any = { user_id: user.id }

  if (symbol && symbol !== 'ALL') {
    where.symbol = symbol
  }

  if (year && year !== 'ALL') {
    const yearNum = parseInt(year)
    where.opened_at = {
      gte: new Date(`${yearNum}-01-01T00:00:00.000Z`),
      lte: new Date(`${yearNum}-12-31T23:59:59.999Z`)
    }
  }

  const trades = await prisma.short_term_trades.findMany({
    where,
    include: {
      legs: {
        orderBy: [{ date: 'desc' }, { created_at: 'desc' }]
      }
    },
    orderBy: [
      { status: 'asc' }, // OPEN first
      { opened_at: 'desc' }
    ]
  })

  // Prisma decimal fixes for Next.js
  const mapped = trades.map(trade => ({
    ...trade,
    total_buy_qty: Number(trade.total_buy_qty),
    total_sell_qty: Number(trade.total_sell_qty),
    average_buy_price: Number(trade.average_buy_price),
    average_sell_price: Number(trade.average_sell_price),
    realized_profit: Number(trade.realized_profit),
    legs: trade.legs.map(leg => ({
      ...leg,
      quantity: Number(leg.quantity),
      price_per_unit: Number(leg.price_per_unit),
      brokerage_fee: Number(leg.brokerage_fee),
    }))
  }))

  // LIFO: the trade whose most recent leg was entered last shows first.
  // Each trade's legs are already sorted latest-first, so legs[0] is its last entry.
  mapped.sort((a, b) => {
    const aLeg = a.legs[0]
    const bLeg = b.legs[0]
    if (!aLeg || !bLeg) return 0
    const dateDiff = new Date(bLeg.date).getTime() - new Date(aLeg.date).getTime()
    if (dateDiff !== 0) return dateDiff
    const bCreated = bLeg.created_at ? new Date(bLeg.created_at).getTime() : 0
    const aCreated = aLeg.created_at ? new Date(aLeg.created_at).getTime() : 0
    return bCreated - aCreated
  })

  return mapped
}

export async function addTradeLeg(data: {
  symbol: string
  type: 'BUY' | 'SELL'
  quantity: number
  price: number
  fee: number
  date: Date
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')

  // Find active OPEN trade for this symbol
  let trade = await prisma.short_term_trades.findFirst({
    where: { user_id: user.id, symbol: data.symbol, status: 'OPEN' }
  })

  if (!trade) {
    if (data.type === 'SELL') {
      throw new Error('Cannot sell without an OPEN trade for this stock.')
    }

    // Create new trade campaign
    trade = await prisma.short_term_trades.create({
      data: {
        user_id: user.id,
        symbol: data.symbol,
        status: 'OPEN',
        opened_at: data.date
      }
    })
  }

  if (data.type === 'SELL') {
    const remainingQty = Number(trade.total_buy_qty) - Number(trade.total_sell_qty)
    if (data.quantity > remainingQty) {
      throw new Error(`Cannot sell more than available holding. Remaining: ${remainingQty} Qty.`)
    }
  }

  // Add the leg
  await prisma.short_term_trade_legs.create({
    data: {
      trade_id: trade.id,
      type: data.type,
      quantity: data.quantity,
      price_per_unit: data.price,
      brokerage_fee: data.fee,
      date: data.date
    }
  })

  // Calculate updated parent values
  const prevBuyQty = Number(trade.total_buy_qty)
  const prevSellQty = Number(trade.total_sell_qty)
  const prevAvgBuy = Number(trade.average_buy_price)
  const prevAvgSell = Number(trade.average_sell_price)
  let prevRealized = Number(trade.realized_profit)

  let newBuyQty = prevBuyQty
  let newSellQty = prevSellQty
  let newAvgBuy = prevAvgBuy
  let newAvgSell = prevAvgSell
  let status = trade.status
  let closedAt = trade.closed_at

  if (data.type === 'BUY') {
    newBuyQty = prevBuyQty + data.quantity
    // Weighted average calculation for buys
    // Note: The user said they will enter fee manually (Brokerage + purchase fee).
    // So Cost = (Qty * Price) + Fee. 
    // Avg Cost = Total Cost / Total Qty
    newAvgBuy = ((prevAvgBuy * prevBuyQty) + ((data.price * data.quantity) + data.fee)) / newBuyQty
  } else {
    newSellQty = prevSellQty + data.quantity
    // Weighted average for sell price tracking
    // Revenue = (Qty * Price) - Fee
    newAvgSell = ((prevAvgSell * prevSellQty) + ((data.price * data.quantity) - data.fee)) / newSellQty
    
    // Realized Profit = (Sell Price - Average Buy Price) * Sell Qty - Brokerage Fee
    const profitFromThisSell = (data.price - newAvgBuy) * data.quantity - data.fee
    prevRealized += profitFromThisSell
    
    if (newSellQty >= newBuyQty) {
      status = 'CLOSED'
      closedAt = data.date
    }
  }

  // Update parent
  await prisma.short_term_trades.update({
    where: { id: trade.id },
    data: {
      total_buy_qty: newBuyQty,
      total_sell_qty: newSellQty,
      average_buy_price: newAvgBuy,
      average_sell_price: newAvgSell,
      realized_profit: prevRealized,
      status: status,
      closed_at: closedAt
    }
  })

  revalidatePath('/short-term/transactions')
  revalidatePath('/short-term')
}

export async function deleteTrade(tradeId: string) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')

  await prisma.short_term_trades.delete({
    where: {
      id: tradeId,
      user_id: user.id
    }
  })

  revalidatePath('/short-term/transactions')
  revalidatePath('/short-term')
}
