'use server'

import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Prisma } from '@/generated/prisma/client'
import { computeShortTermTotals, ShortTermCalcError } from '@/lib/short-term-calc'
import { pastOrTodayDateString } from '@/lib/date-schema'

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

const tradeLegSchema = z.object({
  symbol: z.string().trim().min(1, 'Please select a stock symbol').transform(s => s.toUpperCase()),
  type: z.enum(['BUY', 'SELL']),
  quantity: z.number().int('Quantity must be a whole number').positive('Quantity must be greater than 0'),
  price: z.number().positive('Price must be greater than 0'),
  fee: z.number().min(0, 'Fee cannot be negative'),
  date: pastOrTodayDateString.transform(s => new Date(`${s}T00:00:00.000Z`)),
})

class TradeLegError extends Error {}

export async function addTradeLeg(input: z.input<typeof tradeLegSchema>): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Unauthorized' }

  const parsed = tradeLegSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Validation failed' }
  }
  const data = parsed.data

  try {
    // Serializable so two concurrent submits can't both read the same parent totals
    await prisma.$transaction(
      tx => applyTradeLeg(tx, user.id, data),
      { isolationLevel: 'Serializable' }
    )
  } catch (err) {
    if (err instanceof TradeLegError || err instanceof ShortTermCalcError) return { error: err.message }
    console.error('Error adding trade leg:', err)
    return { error: 'Failed to add trade leg. Please try again.' }
  }

  revalidatePath('/short-term/transactions')
  revalidatePath('/short-term')
  return { success: true }
}

async function applyTradeLeg(
  tx: Prisma.TransactionClient,
  userId: string,
  data: z.output<typeof tradeLegSchema>
) {
  // Find active OPEN trade for this symbol
  let trade = await tx.short_term_trades.findFirst({
    where: { user_id: userId, symbol: data.symbol, status: 'OPEN' }
  })

  if (!trade) {
    if (data.type === 'SELL') {
      throw new TradeLegError('Cannot sell without an OPEN trade for this stock.')
    }

    // Create new trade campaign
    trade = await tx.short_term_trades.create({
      data: {
        user_id: userId,
        symbol: data.symbol,
        status: 'OPEN',
        opened_at: data.date
      }
    })
  }

  if (data.type === 'SELL' && data.date < trade.opened_at) {
    throw new TradeLegError('Sell date cannot be before the trade was opened.')
  }

  // Add the leg
  await tx.short_term_trade_legs.create({
    data: {
      trade_id: trade.id,
      type: data.type,
      quantity: data.quantity,
      price_per_unit: data.price,
      brokerage_fee: data.fee,
      date: data.date
    }
  })

  // Rebuild parent totals from all legs (average cost on shares still held).
  // Throws ShortTermCalcError if a sell exceeds holdings at its date → rolls back.
  const legs = await tx.short_term_trade_legs.findMany({
    where: { trade_id: trade.id },
    select: { type: true, quantity: true, price_per_unit: true, brokerage_fee: true, date: true, created_at: true }
  })
  const totals = computeShortTermTotals(legs.map(l => ({
    type: l.type as 'BUY' | 'SELL',
    quantity: Number(l.quantity),
    price_per_unit: Number(l.price_per_unit),
    brokerage_fee: Number(l.brokerage_fee),
    date: l.date,
    created_at: l.created_at
  })))

  await tx.short_term_trades.update({
    where: { id: trade.id },
    data: {
      total_buy_qty: totals.total_buy_qty,
      total_sell_qty: totals.total_sell_qty,
      average_buy_price: totals.average_buy_price,
      average_sell_price: totals.average_sell_price,
      realized_profit: totals.realized_profit,
      status: totals.status,
      opened_at: totals.opened_at ?? trade.opened_at,
      closed_at: totals.closed_at
    }
  })
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
