'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const smartTransactionSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  company_name: z.string().min(1, "Company Name is required"),
  sector: z.string().optional(),
  type: z.enum(['BUY', 'SELL']),
  quantity: z.number().positive("Quantity must be positive"),
  price_per_unit: z.number().positive("Price must be positive"),
  transaction_date: z.string().min(1, "Date is required"),
  brokerage_fee: z.number().min(0).optional(),
  note: z.string().optional(),
})

export async function getDSECompanies(query: string = '') {
  const supabase = await createClient()
  let dbQuery = supabase
    .from('dse_companies')
    .select('symbol, company_name, sector')
    .order('symbol', { ascending: true })
    
  if (query) {
    dbQuery = dbQuery.ilike('symbol', `%${query}%`).limit(15)
  } else {
    dbQuery = dbQuery.limit(50)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error('Error fetching DSE companies:', error)
    return []
  }

  return data
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

  // 1. Check if the stock already exists in the user's portfolio (`stocks` table)
  let { data: existingStock, error: stockCheckError } = await supabase
    .from('stocks')
    .select('id')
    .eq('user_id', user.id)
    .eq('symbol', symbol)
    .single()

  let stockId = existingStock?.id

  // 2. If not, create it!
  if (!stockId) {
    const { data: newStock, error: insertError } = await supabase
      .from('stocks')
      .insert({
        user_id: user.id,
        symbol,
        company_name,
        sector,
        current_price: type === 'BUY' ? price_per_unit : null, // Set initial current_price based on buy price
        current_price_updated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (insertError || !newStock) {
      console.error("Error auto-creating stock:", insertError)
      return { error: 'Failed to initialize stock in your portfolio.' }
    }
    
    stockId = newStock.id
  } else if (type === 'BUY') {
    // Optionally update current price if they bought it again (keeps tracking updated)
    await supabase.from('stocks').update({
      current_price: price_per_unit,
      current_price_updated_at: new Date().toISOString()
    }).eq('id', stockId)
  }

  // 3. Save the transaction
  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    stock_id: stockId,
    type,
    quantity,
    price_per_unit,
    transaction_date,
    brokerage_fee,
    note
  })

  if (error) {
    console.error('Error adding transaction:', error)
    return { error: 'Failed to save transaction.' }
  }

  revalidatePath('/transactions')
  return { success: 'Transaction saved successfully!' }
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

  // We are not changing the stock symbol on update, just the transaction details
  const { error } = await supabase
    .from('transactions')
    .update({
      type,
      quantity,
      price_per_unit,
      transaction_date,
      brokerage_fee,
      note
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating transaction:', error)
    return { error: 'Failed to update transaction.' }
  }

  revalidatePath('/transactions')
  return { success: 'Transaction updated successfully!' }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting transaction:', error)
    return { error: 'Failed to delete transaction.' }
  }

  revalidatePath('/transactions')
  return { success: true }
}
