'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Get all DSE companies for browsing (search by symbol or name)
export async function getDSECompaniesForWatchlist(query: string = '') {
  try {
    const companies = query
      ? await prisma.dse_companies.findMany({
          where: {
            OR: [
              { symbol: { contains: query, mode: 'insensitive' } },
              { company_name: { contains: query, mode: 'insensitive' } }
            ]
          },
          select: {
            symbol: true,
            company_name: true,
            sector: true,
            category: true,
            current_price: true
          },
          orderBy: { symbol: 'asc' },
          take: 20
        })
      : await prisma.dse_companies.findMany({
          select: {
            symbol: true,
            company_name: true,
            sector: true,
            category: true,
            current_price: true
          },
          orderBy: { symbol: 'asc' },
          take: 50
        })

    return companies.map(c => ({
      ...c,
      current_price: c.current_price ? Number(c.current_price) : null
    }))
  } catch (error) {
    console.error('Error fetching DSE companies for watchlist:', error)
    return []
  }
}

// Get user's watchlist with company details
export async function getWatchlist() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const rawWatchlist = await prisma.watchlist.findMany({
      where: { user_id: user.id },
      select: {
        id: true,
        symbol: true,
        created_at: true,
        profiles: { select: { id: true } }
      },
      orderBy: { created_at: 'desc' }
    })

    // Fetch company details for each watchlist symbol
    const symbols = rawWatchlist.map(w => w.symbol)
    const companies = await prisma.dse_companies.findMany({
      where: { symbol: { in: symbols } },
      select: {
        symbol: true,
        company_name: true,
        sector: true,
        category: true,
        current_price: true,
        updated_at: true
      }
    })

    const companyMap = new Map(companies.map(c => [c.symbol, c]))

    const formattedWatchlist = rawWatchlist.map(w => {
      const company = companyMap.get(w.symbol)
      return {
        id: w.id,
        symbol: w.symbol,
        company_name: company?.company_name || 'Unknown',
        sector: company?.sector || 'N/A',
        category: company?.category || 'N/A',
        current_price: company?.current_price ? Number(company.current_price) : null,
        price_updated_at: company?.updated_at?.toISOString() || null,
        created_at: w.created_at?.toISOString() || new Date().toISOString()
      }
    })

    return { data: formattedWatchlist }
  } catch (error) {
    console.error('Error fetching watchlist:', error)
    return { error: 'Failed to fetch watchlist.' }
  }
}

// Add stock to watchlist
export async function addToWatchlist(symbol: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (!symbol) return { error: 'Symbol is required' }

  try {
    // Ensure user profile exists
    await prisma.profiles.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, email: user.email }
    })

    // Check if already in watchlist
    const existing = await prisma.watchlist.findUnique({
      where: {
        user_id_symbol: {
          user_id: user.id,
          symbol: symbol.toUpperCase()
        }
      }
    })

    if (existing) {
      return { error: 'This stock is already in your watchlist.' }
    }

    // Verify the symbol exists in DSE companies
    const company = await prisma.dse_companies.findUnique({
      where: { symbol: symbol.toUpperCase() },
      select: { symbol: true }
    })

    if (!company) {
      return { error: 'Invalid stock symbol.' }
    }

    await prisma.watchlist.create({
      data: {
        user_id: user.id,
        symbol: symbol.toUpperCase()
      }
    })

    revalidatePath('/watchlist')
    return { success: true }
  } catch (error) {
    console.error('Error adding to watchlist:', error)
    return { error: 'Failed to add stock to watchlist.' }
  }
}

// Remove stock from watchlist
export async function removeFromWatchlist(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await prisma.watchlist.delete({
      where: { id, user_id: user.id }
    })

    revalidatePath('/watchlist')
    return { success: true }
  } catch (error) {
    console.error('Error removing from watchlist:', error)
    return { error: 'Failed to remove stock from watchlist.' }
  }
}

// Get all price alerts for the user with company details
export async function getPriceAlerts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const alerts = await prisma.price_alerts.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' }
    })

    const symbols = alerts.map(a => a.symbol)
    const companies = await prisma.dse_companies.findMany({
      where: { symbol: { in: symbols } },
      select: {
        symbol: true,
        company_name: true,
        sector: true,
        current_price: true
      }
    })

    const companyMap = new Map(companies.map(c => [c.symbol, c]))

    const formattedAlerts = alerts.map(alert => {
      const company = companyMap.get(alert.symbol)
      const currentPrice = company?.current_price ? Number(company.current_price) : null

      // Calculate trigger status
      let buyStatus: 'in_range' | 'below_range' | 'above_range' | 'none' = 'none'
      if (alert.buy_min_price !== null && alert.buy_max_price !== null && currentPrice !== null) {
        const min = Number(alert.buy_min_price)
        const max = Number(alert.buy_max_price)
        if (currentPrice >= min && currentPrice <= max) buyStatus = 'in_range'
        else if (currentPrice < min) buyStatus = 'below_range'
        else buyStatus = 'above_range'
      }

      let sellStatus: 'in_range' | 'below_range' | 'above_range' | 'none' = 'none'
      if (alert.sell_min_price !== null && alert.sell_max_price !== null && currentPrice !== null) {
        const min = Number(alert.sell_min_price)
        const max = Number(alert.sell_max_price)
        if (currentPrice >= min && currentPrice <= max) sellStatus = 'in_range'
        else if (currentPrice < min) sellStatus = 'below_range'
        else sellStatus = 'above_range'
      }

      return {
        id: alert.id,
        symbol: alert.symbol,
        company_name: company?.company_name || 'Unknown',
        sector: company?.sector || 'N/A',
        current_price: currentPrice,
        buy_min_price: alert.buy_min_price ? Number(alert.buy_min_price) : null,
        buy_max_price: alert.buy_max_price ? Number(alert.buy_max_price) : null,
        sell_min_price: alert.sell_min_price ? Number(alert.sell_min_price) : null,
        sell_max_price: alert.sell_max_price ? Number(alert.sell_max_price) : null,
        is_buy_triggered: alert.is_buy_triggered,
        is_sell_triggered: alert.is_sell_triggered,
        buy_status: buyStatus,
        sell_status: sellStatus,
        created_at: alert.created_at?.toISOString() || new Date().toISOString()
      }
    })

    return { data: formattedAlerts }
  } catch (error) {
    console.error('Error fetching price alerts:', error)
    return { error: 'Failed to fetch price alerts.' }
  }
}

// Get watchlist symbols for alert form dropdown
export async function getWatchlistSymbols() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const watchlist = await prisma.watchlist.findMany({
      where: { user_id: user.id },
      select: {
        symbol: true,
        profiles: { select: { id: true } }
      },
      orderBy: { created_at: 'desc' }
    })

    const symbols = watchlist.map(w => w.symbol)
    const companies = await prisma.dse_companies.findMany({
      where: { symbol: { in: symbols } },
      select: {
        symbol: true,
        company_name: true,
        current_price: true
      }
    })

    const companyMap = new Map(companies.map(c => [c.symbol, c]))

    return {
      data: symbols.map(symbol => {
        const company = companyMap.get(symbol)
        return {
          symbol,
          company_name: company?.company_name || 'Unknown',
          current_price: company?.current_price ? Number(company.current_price) : null
        }
      })
    }
  } catch (error) {
    console.error('Error fetching watchlist symbols:', error)
    return { error: 'Failed to fetch watchlist symbols.' }
  }
}

// Add or update price alert
export async function savePriceAlert(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const symbol = (formData.get('symbol') as string)?.toUpperCase()
  const buyMin = formData.get('buy_min_price') ? Number(formData.get('buy_min_price')) : null
  const buyMax = formData.get('buy_max_price') ? Number(formData.get('buy_max_price')) : null
  const sellMin = formData.get('sell_min_price') ? Number(formData.get('sell_min_price')) : null
  const sellMax = formData.get('sell_max_price') ? Number(formData.get('sell_max_price')) : null

  if (!symbol) return { error: 'Please select a stock symbol.' }

  // Validate: at least one range must be provided
  if (!buyMin && !buyMax && !sellMin && !sellMax) {
    return { error: 'Please set at least one price range (buy or sell).' }
  }

  // Validate buy range
  if ((buyMin && !buyMax) || (!buyMin && buyMax)) {
    return { error: 'Buy price range needs both min and max values.' }
  }
  if (buyMin && buyMax && buyMin > buyMax) {
    return { error: 'Buy min price cannot be greater than max price.' }
  }

  // Validate sell range
  if ((sellMin && !sellMax) || (!sellMin && sellMax)) {
    return { error: 'Sell price range needs both min and max values.' }
  }
  if (sellMin && sellMax && sellMin > sellMax) {
    return { error: 'Sell min price cannot be greater than max price.' }
  }

  try {
    await prisma.profiles.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, email: user.email }
    })

    // Check if alert already exists for this symbol
    const existing = await prisma.price_alerts.findUnique({
      where: {
        user_id_symbol: {
          user_id: user.id,
          symbol
        }
      }
    })

    if (existing) {
      await prisma.price_alerts.update({
        where: { id: existing.id },
        data: {
          buy_min_price: buyMin,
          buy_max_price: buyMax,
          sell_min_price: sellMin,
          sell_max_price: sellMax,
          is_buy_triggered: false,
          is_sell_triggered: false
        }
      })
    } else {
      await prisma.price_alerts.create({
        data: {
          user_id: user.id,
          symbol,
          buy_min_price: buyMin,
          buy_max_price: buyMax,
          sell_min_price: sellMin,
          sell_max_price: sellMax
        }
      })
    }

    revalidatePath('/watchlist/alerts')
    return { success: true }
  } catch (error) {
    console.error('Error saving price alert:', error)
    return { error: 'Failed to save price alert.' }
  }
}

// Delete price alert
export async function deletePriceAlert(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await prisma.price_alerts.delete({
      where: { id, user_id: user.id }
    })

    revalidatePath('/watchlist/alerts')
    return { success: true }
  } catch (error) {
    console.error('Error deleting price alert:', error)
    return { error: 'Failed to delete price alert.' }
  }
}