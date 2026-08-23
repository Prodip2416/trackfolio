'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import LedgerFilters from './LedgerFilters'
import LedgerSummaryCards from './LedgerSummaryCards'
import LedgerTable from './LedgerTable'

type LedgerRow = {
  id: string
  date: string
  type: string
  symbol: string
  company_name: string
  quantity: number
  price_per_unit: number | null
  total: number
}

type Stock = {
  id: string
  symbol: string
  company_name: string
}

export default function LedgerClient({ 
  stocks, 
  initialData, 
  initialStockId, 
  initialYear,
  initialType,
  dict 
}: { 
  stocks: Stock[]
  initialData: LedgerRow[]
  initialStockId: string
  initialYear: string
  initialType: string
  dict: any
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(false)
  }, [searchParams])

  let totalShareCount = 0
  let totalCashDividend = 0
  let totalBuyPrice = 0
  let totalBonusShare = 0
  let totalSellPrice = 0

  initialData.forEach(row => {
    if (row.type === 'BUY') {
      totalShareCount += row.quantity
      totalBuyPrice += row.total
    } else if (row.type === 'SELL') {
      totalShareCount -= row.quantity
      totalSellPrice += row.total
    } else if (row.type === 'DIVIDEND') {
      totalBonusShare += row.quantity
      totalShareCount += row.quantity
      totalCashDividend += row.total
    }
  })

  const handleFilterChange = (key: string, value: string) => {
    setIsLoading(true)
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'ALL' && key !== 'year') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-120px)] space-y-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {dict.sidebar?.assetLedger || 'Asset Ledger'}
          </h2>
        </div>
        
        <LedgerFilters 
          stocks={stocks}
          initialStockId={initialStockId}
          initialYear={initialYear}
          initialType={initialType}
          handleFilterChange={handleFilterChange}
        />
      </div>

      <LedgerSummaryCards 
        totalShareCount={totalShareCount}
        totalBuyPrice={totalBuyPrice}
        totalSellPrice={totalSellPrice}
        totalCashDividend={totalCashDividend}
        totalBonusShare={totalBonusShare}
        dict={dict}
      />

      <LedgerTable 
        data={initialData}
        isPending={isPending}
        isLoading={isLoading}
        dict={dict}
      />
    </div>
  )
}
