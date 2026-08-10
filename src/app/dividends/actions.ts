'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { recalculateStockAggregates } from '@/lib/stock-aggregates'

const dividendSchema = z.object({
  symbol: z.string().min(1, 'Please select a valid Stock Symbol'),
  type: z.enum(['INTERIM', 'FINAL']),
  year: z.number().min(2000, "Year must be 2000 or later").max(2100, "Year must be 2100 or earlier"),
  cash_amount: z.number().min(0, "Cash amount cannot be negative").nullable().optional(),
  bonus_quantity: z.number().min(0, "Bonus quantity cannot be negative").nullable().optional(),
  date: z.string().min(1, 'Please select a Declaration Date'),
  note: z.string().optional()
})

// Gets unique stocks the user has bought to populate the dropdown
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

export async function addDividend(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const validatedFields = dividendSchema.safeParse({
    symbol: formData.get('symbol'),
    type: formData.get('type'),
    year: Number(formData.get('year')),
    cash_amount: formData.get('cash_amount') ? Number(formData.get('cash_amount')) : null,
    bonus_quantity: formData.get('bonus_quantity') ? Number(formData.get('bonus_quantity')) : null,
    date: formData.get('date'),
    note: formData.get('note') || '',
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues?.[0]?.message || 'Validation failed' }
  }

  const {
    symbol,
    type,
    year,
    cash_amount,
    bonus_quantity,
    date,
    note
  } = validatedFields.data

  try {
    // 0. Ensure user profile exists (replaces Supabase db trigger)
    await prisma.profiles.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, email: user.email }
    })

    // 1. Get the stock id for this symbol in user's portfolio
    const stock = await prisma.stocks.findFirst({
      where: { user_id: user.id, symbol }
    })

    if (!stock) {
      return { error: 'You do not own this stock in your portfolio.' }
    }

    // 2. Check for duplicate dividend on the same date
    const existingDividend = await prisma.dividends.findFirst({
      where: {
        user_id: user.id,
        stock_id: stock.id,
        date: new Date(date)
      }
    })

    if (existingDividend) {
      return { error: 'A dividend for this stock on this date already exists.' }
    }

    // 3. Create the dividend record
    await prisma.dividends.create({
      data: {
        user_id: user.id,
        stock_id: stock.id,
        type: type as any,
        year,
        cash_amount,
        bonus_quantity,
        date: new Date(date),
        note
      }
    })

    await recalculateStockAggregates(stock.id)

    revalidatePath('/dividends')
    revalidatePath('/portfolio')
    return { success: 'Dividend added successfully!' }
  } catch (error) {
    console.error('Error adding dividend:', error)
    return { error: 'Failed to add dividend.' }
  }
}

export async function deleteDividend(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const div = await prisma.dividends.findUnique({ where: { id, user_id: user.id } })
    if (!div) return { error: 'Dividend not found' }

    await prisma.dividends.delete({
      where: { id, user_id: user.id }
    })
    
    await recalculateStockAggregates(div.stock_id!)

    revalidatePath('/dividends')
    revalidatePath('/portfolio')
    return { success: true }
  } catch (error) {
    console.error('Error deleting dividend:', error)
    return { error: 'Failed to delete dividend.' }
  }
}
