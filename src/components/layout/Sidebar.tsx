'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowRightLeft, History, Coins, Briefcase, PieChart, ChevronDown, ChevronRight, FileText } from 'lucide-react'

export default function Sidebar({ dict }: { dict: any }) {
  const pathname = usePathname() || ''
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)
  const [isReportsOpen, setIsReportsOpen] = useState(false)
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false)

  // Automatically open the analytics menu if the user is on an analytics page
  useEffect(() => {
    if (pathname.startsWith('/analytics')) {
      setIsAnalyticsOpen(true)
    }
    if (pathname.startsWith('/reports')) {
      setIsReportsOpen(true)
    }
    if (pathname.startsWith('/portfolio')) {
      setIsPortfolioOpen(true)
    }
  }, [pathname])

  const navItems = [
    { name: dict.sidebar.dashboard, href: '/', icon: LayoutDashboard },
    { 
      name: dict.sidebar.analytics, 
      icon: PieChart,
      subItems: [
        { name: dict.sidebar.performance, href: '/analytics/performance' },
        { name: dict.sidebar.diversification, href: '/analytics/diversification' },
        { name: dict.sidebar.dividendInsights, href: '/analytics/dividends' },
        { name: dict.sidebar.tradingBehavior, href: '/analytics/trading' },
        { name: dict.sidebar.marketTiming, href: '/analytics/timing' },
        { name: dict.sidebar.riskWarnings, href: '/analytics/warnings' },
      ]
    },
    { 
      name: dict.sidebar.portfolio, 
      icon: Briefcase,
      subItems: [
        { name: dict.sidebar.overview, href: '/portfolio' },
        { name: dict.sidebar.assetLedger, href: '/portfolio/ledger' },
      ]
    },
    { name: dict.sidebar.tradeLog, href: '/transactions', icon: ArrowRightLeft },
    { name: dict.sidebar.dividendLog, href: '/dividends', icon: Coins },
    { name: dict.sidebar.history, href: '/history', icon: History },
    {
      name: dict.sidebar.reports,
      icon: FileText,
      subItems: [
        { name: dict.sidebar.taxCapitalGain, href: '/reports/tax' },
        { name: dict.sidebar.buyReport, href: '/reports/buy' },
        { name: dict.sidebar.sellReport, href: '/reports/sell' },
        { name: dict.sidebar.dividendReport, href: '/reports/dividend' },
      ]
    },
  ]

  return (
    <div className="w-64 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl backdrop-saturate-150 border-r border-gray-200/50 dark:border-slate-800 h-screen sticky top-0 flex flex-col shadow-sm print:hidden transition-colors duration-200">
      <div className="h-16 flex items-center px-6 border-b border-gray-200/50 dark:border-slate-800 transition-colors duration-200">
        <Link href="/" className="block hover:opacity-80 transition-opacity">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight transition-colors duration-200">Track<span className="text-indigo-600 dark:text-indigo-500">Folio</span></h1>
        </Link>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          if (item.subItems) {
            const isActive = pathname.startsWith(
              item.name === dict.sidebar.reports ? '/reports' : 
              item.name === dict.sidebar.portfolio ? '/portfolio' : 
              '/analytics'
            )
            const isOpen = item.name === dict.sidebar.reports ? isReportsOpen : 
                           item.name === dict.sidebar.portfolio ? isPortfolioOpen :
                           isAnalyticsOpen
            const toggleOpen = () => {
              if (item.name === dict.sidebar.reports) setIsReportsOpen(!isReportsOpen)
              else if (item.name === dict.sidebar.portfolio) setIsPortfolioOpen(!isPortfolioOpen)
              else setIsAnalyticsOpen(!isAnalyticsOpen)
            }
            const Icon = item.icon
            return (
              <div key={item.name} className="flex flex-col space-y-1">
                <button
                  onClick={toggleOpen}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-50/50 dark:from-indigo-900/20 to-transparent text-indigo-700 dark:text-indigo-400 shadow-[inset_3px_0_0_0_#4f46e5] dark:shadow-[inset_3px_0_0_0_#818cf8]'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <span className="flex items-center">
                    <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'}`} />
                    {item.name}
                  </span>
                  {isOpen ? (
                    <ChevronDown className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  ) : (
                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  )}
                </button>
                
                {isOpen && (
                  <div className="pl-11 pr-2 space-y-1 py-1">
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname === sub.href
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={`block px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                            isSubActive
                              ? 'bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50/50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {sub.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href!}
              className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-50/50 dark:from-indigo-900/20 to-transparent text-indigo-700 dark:text-indigo-400 shadow-[inset_3px_0_0_0_#4f46e5] dark:shadow-[inset_3px_0_0_0_#818cf8]'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'}`} />
              {item.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
