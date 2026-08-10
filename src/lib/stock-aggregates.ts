import prisma from '@/lib/prisma'

export async function recalculateStockAggregates(stockId: string) {
  // Get all transactions for this stock ordered by date
  const transactions = await prisma.transactions.findMany({
    where: { stock_id: stockId },
    orderBy: { transaction_date: 'asc' }
  })

  // Get all dividends for this stock ordered by date
  const dividends = await prisma.dividends.findMany({
    where: { stock_id: stockId },
    orderBy: { date: 'asc' }
  })

  // We need to merge and sort them chronologically to simulate history
  type Transaction = (typeof transactions)[number]
  type Dividend = (typeof dividends)[number]
  type TimelineEvent = 
    | { type: 'TX', date: Date, data: Transaction }
    | { type: 'DIV', date: Date, data: Dividend }
  
  const events: TimelineEvent[] = [
    ...transactions.map(t => ({ type: 'TX' as const, date: t.transaction_date, data: t })),
    ...dividends.map(d => ({ type: 'DIV' as const, date: d.date, data: d }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  let totalQuantity = 0
  let totalInvestment = 0
  let averageBuyPrice = 0
  let portfolioPrice = 0
  let portfolioCost = 0

  for (const event of events) {
    if (event.type === 'TX') {
      const txn = event.data
      const qty = Number(txn.quantity)
      const price = Number(txn.price_per_unit)
      const fee = Number(txn.brokerage_fee || 0)

      if (txn.type === 'BUY') {
        const cost = (qty * price) + fee
        // Calculate new average buy price
        if (totalQuantity + qty > 0) {
          averageBuyPrice = ((totalQuantity * averageBuyPrice) + cost) / (totalQuantity + qty)
        }
        
        totalQuantity += qty
        totalInvestment += cost
        portfolioCost += cost
        portfolioPrice = totalQuantity > 0 ? portfolioCost / totalQuantity : 0
      } else if (txn.type === 'SELL') {
        const costBasisPrice = totalQuantity > 0 ? totalInvestment / totalQuantity : 0
        const adjustedPortfolioPrice = totalQuantity > 0 ? portfolioCost / totalQuantity : 0

        totalQuantity -= qty
        totalInvestment -= (qty * costBasisPrice)
        portfolioCost -= (qty * adjustedPortfolioPrice)
        // averageBuyPrice remains same
        portfolioPrice = totalQuantity > 0 ? portfolioCost / totalQuantity : 0
        
        // Prevent negative values from rounding errors
        if (totalQuantity <= 0) {
          totalQuantity = 0
          totalInvestment = 0
          portfolioCost = 0
          portfolioPrice = 0
          averageBuyPrice = 0
        }
      }
    } else if (event.type === 'DIV') {
      const div = event.data
      if (div.cash_amount) {
        portfolioCost -= Number(div.cash_amount)
        portfolioPrice = totalQuantity > 0 ? portfolioCost / totalQuantity : 0
      }
      if (div.bonus_quantity) {
        totalQuantity += Number(div.bonus_quantity)
        portfolioPrice = totalQuantity > 0 ? portfolioCost / totalQuantity : 0
      }
    }
  }

  // Update the stock record
  await prisma.stocks.update({
    where: { id: stockId },
    data: {
      total_quantity: totalQuantity,
      total_investment: totalInvestment,
      average_buy_price: averageBuyPrice,
      portfolio_price: portfolioPrice,
      updated_at: new Date()
    }
  })
}
