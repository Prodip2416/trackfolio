import prisma from '@/lib/prisma'
import { todayInDhaka } from '@/lib/date'

/**
 * Records today's price as this year's year-end price for every symbol someone holds.
 * Runs after each DSE price sync: the row is overwritten on every sync of the year, so the
 * last sync of December leaves the real year-end price. Rows entered by hand
 * (source = 'manual') are never overwritten. Year boundaries follow Asia/Dhaka.
 */
export async function snapshotYearEndPrices(): Promise<number> {
  const today = todayInDhaka()
  const year = Number(today.slice(0, 4))
  return prisma.$executeRaw`
    INSERT INTO public.year_end_prices (symbol, year, price, price_date, source)
    SELECT c.symbol, ${year}::int, c.current_price, ${today}::date, 'sync'
    FROM public.dse_companies c
    WHERE c.current_price > 0
      AND EXISTS (SELECT 1 FROM public.stocks s WHERE s.symbol = c.symbol AND s.total_quantity > 0)
    ON CONFLICT (symbol, year) DO UPDATE
      SET price = EXCLUDED.price, price_date = EXCLUDED.price_date, updated_at = now()
      WHERE public.year_end_prices.source = 'sync'
  `
}
