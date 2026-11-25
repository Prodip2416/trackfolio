'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { getDictionary } from '@/i18n/getDictionary'
import { isRealIsoDate, todayInDhaka } from '@/lib/date'
import { fmt } from '@/lib/prize-bond/i18n'
import { canEditYearEndPrice, requiredYearEndPrices } from '@/lib/returns'
import { loadReturnsData } from '@/lib/returns-service'

const inputSchema = z.object({
  symbol: z.string().trim().toUpperCase().min(1).max(30),
  year: z.number().int().min(1990),
  price: z.number().finite().gt(0).lt(10_000_000),
  priceDate: z.string().refine(isRealIsoDate)
})

/** Enter a past year's year-end price by hand (only for a symbol the user held at that year end). */
export async function saveYearEndPrice(input: { symbol: string; year: number; price: number; priceDate: string }) {
  const supabase = await createClient()
  const [{ data: { user } }, dict] = await Promise.all([supabase.auth.getUser(), getDictionary()])
  const t = dict.returns
  if (!user) return { error: t.errors.unauthorized }

  const parsed = inputSchema.safeParse(input)
  const today = todayInDhaka()
  const currentYear = Number(today.slice(0, 4))
  if (
    !parsed.success ||
    parsed.data.year >= currentYear ||
    Number(parsed.data.priceDate.slice(0, 4)) !== parsed.data.year
  ) {
    return { error: fmt(t.errors.invalid, { year: input.year }) }
  }
  const { symbol, year, price, priceDate } = parsed.data

  try {
    const data = await loadReturnsData(user.id)
    if (!requiredYearEndPrices(data.txns, data.dividends, year).some(r => r.symbol === symbol)) {
      return { error: fmt(t.errors.notHeld, { symbol, year }) }
    }

    const existing = await prisma.year_end_prices.findUnique({
      where: { symbol_year: { symbol, year } },
      select: { price: true, price_date: true, source: true }
    })
    const current = existing && {
      price: Number(existing.price),
      priceDate: existing.price_date.toISOString().slice(0, 10),
      source: existing.source === 'manual' ? ('manual' as const) : ('sync' as const)
    }
    if (!canEditYearEndPrice(current ?? undefined, year)) return { error: t.errors.locked }

    const values = {
      price,
      price_date: new Date(`${priceDate}T00:00:00.000Z`),
      source: 'manual',
      updated_by: user.id,
      updated_at: new Date()
    }
    await prisma.year_end_prices.upsert({
      where: { symbol_year: { symbol, year } },
      update: values,
      create: { symbol, year, ...values }
    })
  } catch (e) {
    console.error('saveYearEndPrice failed:', e)
    return { error: t.errors.saveFailed }
  }

  revalidatePath('/analytics/returns', 'layout')
  return { success: true }
}
