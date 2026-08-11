import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { recalculateStockAggregates } from '@/lib/stock-aggregates'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    console.log('Fetching live prices from DSEBD...')
    
    // 1. Fetch Latest Prices
    const priceResponse = await fetch('https://www.dsebd.org/latest_share_price_scroll_l.php', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store'
    })
    
    const priceHtml = await priceResponse.text()
    const priceRegex = /displayCompany\.php\?name=([^\"\&]+)[\s\S]*?&nbsp;([\d\.]+)/gi;
    const priceMap = new Map<string, number>()
    let match;
    
    while ((match = priceRegex.exec(priceHtml)) !== null) {
      const symbol = match[1].trim().toUpperCase()
      const price = parseFloat(match[2])
      if (!isNaN(price)) {
        priceMap.set(symbol, price)
      }
    }

    // 2. Get User's Stocks symbols to know which ones to fetch contact info for
    const userStocks = await prisma.stocks.findMany({
      where: { user_id: user.id },
      select: { id: true, symbol: true }
    })

    // 3. Update current_price for ALL DSE companies in the master table
    await Promise.all(Array.from(priceMap.entries()).map(([sym, p]) => 
      prisma.dse_companies.updateMany({
        where: { symbol: sym },
        data: { current_price: p, updated_at: new Date() }
      })
    ))

    // 4. Update Contact Info for the user's specific unique symbols in dse_companies
    const uniqueSymbols = Array.from(new Set(userStocks.map(s => s.symbol)))
    
    await Promise.all(uniqueSymbols.map(async (symbol) => {
      try {
        const response = await fetch(`https://www.dsebd.org/displayCompany.php?name=${symbol}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          cache: 'no-store'
        })
        const html = await response.text()
        
        let address: string | null = null;
        let phone: string | null = null;
        let email: string | null = null;
        
        const lines = html.split('\n');
        for(let j=0; j<lines.length; j++) {
          if(lines[j].includes('Head Office') || lines[j].includes('>Address<')) {
              const lookahead = lines.slice(j, j+4).join(' ');
              const m = lookahead.match(/<td width="80%">(.*?)<\/td>/i) || lookahead.match(/<td[^>]*>(.*?)<\/td>/ig);
              if (m && m[0]) {
                const val = (typeof m === 'string' ? m : m[0]).replace(/<[^>]*>?/gm, '').trim();
                if (val && val.length > 5 && val !== 'Address' && val !== 'Head Office') address = val;
              }
          }
          if(lines[j].includes('Contact Phone<')) {
              const m = lines[j+1].match(/<td>(.*?)<\/td>/i);
              if (m && m[1]) phone = m[1].trim();
          }
          if(lines[j].includes('E-mail<')) {
              const m = lines[j+1].match(/<td>(.*?)<\/td>/i);
              if (m && m[1]) email = m[1].trim();
          }
        }
        
        if (address === '') address = null;
        if (phone === '') phone = null;
        if (email === '') email = null;
        
        if (address || phone || email) {
          // Upsert into dse_companies just to be safe
          await prisma.dse_companies.update({
            where: { symbol },
            data: {
              ...(address ? { address } : {}),
              ...(phone ? { phone } : {}),
              ...(email ? { email } : {})
            }
          })
        }
      } catch (e) {
        console.error(`Failed to update contact info for ${symbol}`, e)
      }
    }))

    await Promise.all(userStocks.map(stock => recalculateStockAggregates(stock.id)))

    revalidatePath('/', 'layout')
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Sync Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
