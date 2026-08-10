'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { recalculateStockAggregates } from '@/lib/stock-aggregates'

const smartTransactionSchema = z.object({
  symbol: z.string().min(1, "Please select a valid Stock Symbol"),
  company_name: z.string().min(1, "Company Name is required"),
  sector: z.string().optional(),
  type: z.enum(['BUY', 'SELL']),
  quantity: z.number().positive("Quantity must be greater than 0"),
  price_per_unit: z.number().positive("Price must be greater than 0"),
  transaction_date: z.string().min(1, "Please select a valid Transaction Date"),
  brokerage_fee: z.number().min(0, "Brokerage fee cannot be negative").optional(),
  note: z.string().optional(),
})

export async function getDSECompanies(query: string = '') {
  try {
    if (query) {
      return await prisma.dse_companies.findMany({
        where: { symbol: { contains: query, mode: 'insensitive' } },
        select: { symbol: true, company_name: true, sector: true },
        orderBy: { symbol: 'asc' },
        take: 15
      })
    } else {
      return await prisma.dse_companies.findMany({
        select: { symbol: true, company_name: true, sector: true },
        orderBy: { symbol: 'asc' },
        take: 50
      })
    }
  } catch (error) {
    console.error('Error fetching DSE companies:', error)
    return []
  }
}

export async function addSmartTransaction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'You must be logged in to add a transaction.' }
  }

  const validatedFields = smartTransactionSchema.safeParse({
    symbol: formData.get('symbol'),
    company_name: formData.get('company_name'),
    sector: formData.get('sector') || '',
    type: formData.get('type'),
    quantity: Number(formData.get('quantity')),
    price_per_unit: Number(formData.get('price_per_unit')),
    transaction_date: formData.get('transaction_date'),
    brokerage_fee: formData.get('brokerage_fee') ? Number(formData.get('brokerage_fee')) : 0,
    note: formData.get('note') || '',
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues?.[0]?.message || 'Validation failed' }
  }

  const {
    symbol,
    company_name,
    sector,
    type,
    quantity,
    price_per_unit,
    transaction_date,
    brokerage_fee,
    note
  } = validatedFields.data

  try {
    // 0. Ensure user profile exists (replaces Supabase db trigger)
    await prisma.profiles.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, email: user.email }
    })

    // 1. Check if the stock already exists in the user's portfolio (`stocks` table)
    let existingStock = await prisma.stocks.findFirst({
      where: { user_id: user.id, symbol }
    })

    let stockId = existingStock?.id

    // 2. If not, create it!
    if (!stockId) {
      const newStock = await prisma.stocks.create({
        data: {
          user_id: user.id,
          symbol
        }
      })
      stockId = newStock.id
    } else if (type === 'BUY') {
      // Intentionally left blank, no need to update current_price on stocks anymore
    }

    // 3. Save the transaction
    await prisma.transactions.create({
      data: {
        user_id: user.id,
        stock_id: stockId,
        type: type as any,
        quantity,
        price_per_unit,
        transaction_date: new Date(transaction_date),
        brokerage_fee,
        note
      }
    })

    // 4. Recalculate Aggregates
    await recalculateStockAggregates(stockId)

    revalidatePath('/transactions')
    return { success: 'Transaction saved successfully!' }
  } catch (error) {
    console.error('Error adding transaction:', error)
    return { error: 'Failed to save transaction.' }
  }
}

export async function updateSmartTransaction(id: string, prevState: any, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'You must be logged in to update a transaction.' }
  }

  const validatedFields = smartTransactionSchema.safeParse({
    symbol: formData.get('symbol'),
    company_name: formData.get('company_name'),
    sector: formData.get('sector') || '',
    type: formData.get('type'),
    quantity: Number(formData.get('quantity')),
    price_per_unit: Number(formData.get('price_per_unit')),
    transaction_date: formData.get('transaction_date'),
    brokerage_fee: formData.get('brokerage_fee') ? Number(formData.get('brokerage_fee')) : 0,
    note: formData.get('note') || '',
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues?.[0]?.message || 'Validation failed' }
  }

  const {
    type,
    quantity,
    price_per_unit,
    transaction_date,
    brokerage_fee,
    note
  } = validatedFields.data

  try {
    // We are not changing the stock symbol on update, just the transaction details
    await prisma.transactions.updateMany({
      where: { id, user_id: user.id },
      data: {
        type: type as any,
        quantity,
        price_per_unit,
        transaction_date: new Date(transaction_date),
        brokerage_fee,
        note
      }
    })

    const txn = await prisma.transactions.findUnique({ where: { id, user_id: user.id } })
    if (txn) {
      await recalculateStockAggregates(txn.stock_id!)
    }

    revalidatePath('/transactions')
    return { success: 'Transaction updated successfully!' }
  } catch (error) {
    console.error('Error updating transaction:', error)
    return { error: 'Failed to update transaction.' }
  }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const txn = await prisma.transactions.findUnique({ where: { id, user_id: user.id } })
    if (!txn) return { error: 'Transaction not found' }

    await prisma.transactions.delete({
      where: { id, user_id: user.id }
    })
    
    // Recalculate Aggregates
    await recalculateStockAggregates(txn.stock_id!)

    revalidatePath('/transactions')
    return { success: true }
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return { error: 'Failed to delete transaction.' }
  }
}
