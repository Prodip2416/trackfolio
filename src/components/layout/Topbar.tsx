'use client'

import { User } from '@supabase/supabase-js'
import { ChevronRight, RefreshCw, LayoutDashboard, PieChart, Briefcase, FileText, ArrowRightLeft, Coins, History, Menu } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import toast from 'react-hot-toast'
import { useMobileMenu } from './MobileMenuProvider'

export default function Topbar({ lastSyncTime, dict }: { user: User, lastSyncTime?: string | null, dict: any }) {
  const [isTransitionPending, startTransition] = useTransition()
  const [isFetching, setIsFetching] = useState(false)
  const isPending = isTransitionPending || isFetching
  
  const router = useRouter()
  const pathname = usePathname() || '/'
  const { setIsOpen } = useMobileMenu()
  
  const handleSync = async () => {
    if (isPending) return
    setIsFetching(true)
    
    fetch('/api/sync', { method: 'POST' })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to sync prices')
        }
        
        // Use transition to keep the loading state active while Next.js refreshes the page
        startTransition(() => {
          router.refresh()
        })
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to sync prices')
      })
      .finally(() => {
        setIsFetching(false)
      })
  }

  const getBreadcrumbs = () => {
    const items: Array<{ name: string; icon?: any }> = [
      { name: dict.common.trackfolio, icon: LayoutDashboard }
    ]

    if (pathname === '/') {
      items.push({ name: dict.sidebar.dashboard })
    } else if (pathname.startsWith('/analytics')) {
      items.push({ name: dict.sidebar.analytics, icon: PieChart })
      if (pathname === '/analytics/performance') items.push({ name: dict.sidebar.performance })
      else if (pathname === '/analytics/diversification') items.push({ name: dict.sidebar.diversification })
      else if (pathname === '/analytics/dividends') items.push({ name: dict.sidebar.dividendInsights })
      else if (pathname === '/analytics/trading') items.push({ name: dict.sidebar.tradingBehavior })
      else if (pathname === '/analytics/timing') items.push({ name: dict.sidebar.marketTiming })
      else if (pathname === '/analytics/warnings') items.push({ name: dict.sidebar.riskWarnings })
    } else if (pathname.startsWith('/portfolio')) {
      items.push({ name: dict.sidebar.portfolio, icon: Briefcase })
      if (pathname === '/portfolio/ledger') items.push({ name: dict.sidebar.assetLedger })
      else if (pathname === '/portfolio') items.push({ name: dict.sidebar.overview })
    } else if (pathname.startsWith('/reports')) {
      items.push({ name: dict.sidebar.reports, icon: FileText })
      if (pathname === '/reports/tax') items.push({ name: dict.sidebar.taxCapitalGain })
      else if (pathname === '/reports/buy') items.push({ name: dict.sidebar.buyReport })
      else if (pathname === '/reports/sell') items.push({ name: dict.sidebar.sellReport })
      else if (pathname === '/reports/dividend') items.push({ name: dict.sidebar.dividendReport })
    } else if (pathname === '/transactions') {
      items.push({ name: dict.sidebar.tradeLog, icon: ArrowRightLeft })
    } else if (pathname === '/dividends') {
      items.push({ name: dict.sidebar.dividendLog, icon: Coins })
    } else if (pathname === '/history') {
      items.push({ name: dict.sidebar.history, icon: History })
    }

    return items
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="h-16 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl backdrop-saturate-150 border-b border-gray-200/50 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shadow-sm print:hidden transition-colors duration-200">
      
      {/* Left Section: Mobile Menu + Breadcrumb */}
      <div className="flex items-center w-[60%] sm:w-1/2 overflow-hidden">
        <button 
          onClick={() => setIsOpen(true)}
          className="mr-3 lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center text-sm font-medium overflow-x-auto whitespace-nowrap hide-scrollbar">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1
            return (
              <div key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="w-4 h-4 mx-1.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />}
                <span className={`flex items-center ${isLast ? 'text-gray-800 dark:text-gray-200 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                  {item.icon && <item.icon className="w-4 h-4 mr-1.5 hidden sm:inline-block" />}
                  {item.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sync Button (Right) */}
      <div className="flex items-center justify-end space-x-4 w-1/2">
        {lastSyncTime && (
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{dict.common.lastSynced}</p>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {new Date(lastSyncTime).toLocaleString('en-US', { 
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true 
              })}
            </p>
          </div>
        )}
        <button
          onClick={handleSync}
          disabled={isPending}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-70 shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isPending ? 'animate-spin' : ''}`} />
          {isPending ? dict.common.syncing : dict.common.syncWithDse}
        </button>
      </div>
      
    </div>
  )
}
