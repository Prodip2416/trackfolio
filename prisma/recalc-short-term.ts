// One-off: rebuild every short_term_trades row from its legs using the fixed
// average-cost-on-held-shares logic (src/lib/short-term-calc.ts).
//
// Dry run (default, read-only):  npx tsx prisma/recalc-short-term.ts
// Apply changes:                 npx tsx prisma/recalc-short-term.ts --apply
//
// Run ONLY against a dev/stage DATABASE_URL.
import prisma from '../src/lib/prisma'
import { computeShortTermTotals } from '../src/lib/short-term-calc'

const apply = process.argv.includes('--apply')
const near = (a: number, b: number) => Math.abs(a - b) < 0.005

async function main() {
  const trades = await prisma.short_term_trades.findMany({ include: { legs: true } })
  let changed = 0, failed = 0

  for (const t of trades) {
    try {
      const r = computeShortTermTotals(t.legs.map(l => ({
        type: l.type as 'BUY' | 'SELL',
        quantity: Number(l.quantity),
        price_per_unit: Number(l.price_per_unit),
        brokerage_fee: Number(l.brokerage_fee),
        date: l.date,
        created_at: l.created_at,
      })))

      const same =
        near(Number(t.realized_profit), r.realized_profit) &&
        near(Number(t.average_buy_price), r.average_buy_price) &&
        near(Number(t.average_sell_price), r.average_sell_price) &&
        t.status === r.status
      if (same) continue

      changed++
      console.log(`${t.symbol} ${t.id}: realized ${Number(t.realized_profit).toFixed(2)} → ${r.realized_profit.toFixed(2)}, status ${t.status} → ${r.status}`)

      if (apply) {
        await prisma.short_term_trades.update({
          where: { id: t.id },
          data: {
            total_buy_qty: r.total_buy_qty,
            total_sell_qty: r.total_sell_qty,
            average_buy_price: r.average_buy_price,
            average_sell_price: r.average_sell_price,
            realized_profit: r.realized_profit,
            status: r.status,
            opened_at: r.opened_at ?? t.opened_at,
            closed_at: r.closed_at,
          },
        })
      }
    } catch (e) {
      failed++
      console.error(`${t.symbol} ${t.id}: ${(e as Error).message}`)
    }
  }

  console.log(`\n${trades.length} trades checked, ${changed} differ, ${failed} failed. ${apply ? 'Applied.' : 'Dry run — pass --apply to write.'}`)
}

main().finally(() => prisma.$disconnect())
