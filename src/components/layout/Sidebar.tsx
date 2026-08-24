'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ArrowRightLeft, History, Coins, Briefcase, PieChart, ChevronDown, ChevronRight, FileText, LogOut, Sun, Moon, Globe, Loader2, Star, Bell } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { logout } from '@/app/auth/actions'
import { setLanguage } from '@/app/actions/i18n'
import { useTheme } from 'next-themes'
import { Pacifico } from 'next/font/google'

const pacifico = Pacifico({ subsets: ['latin'], weight: ['400'] })

export default function Sidebar({ dict, user }: { dict: any, user?: User }) {
  const pathname = usePathname() || ''
  const router = useRouter()
  const [isTransitioning, startTransition] = useTransition()
  
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const changeLanguage = (lang: 'en' | 'bn') => {
    startTransition(async () => {
      await setLanguage(lang)
      router.refresh()
    })
  }

  const userInitial = user ? (user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase() : 'U'
  const userName = user ? (user.user_metadata?.full_name || user.email?.split('@')[0] || 'User') : 'User'
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)
  const [isReportsOpen, setIsReportsOpen] = useState(false)
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false)

  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false)

  useEffect(() => {
    if (pathname.startsWith('/analytics')) {
      setIsAnalyticsOpen(true)
      setIsReportsOpen(false)
      setIsPortfolioOpen(false)
      setIsWatchlistOpen(false)
    } else if (pathname.startsWith('/reports')) {
      setIsReportsOpen(true)
      setIsAnalyticsOpen(false)
      setIsPortfolioOpen(false)
      setIsWatchlistOpen(false)
    } else if (pathname.startsWith('/portfolio')) {
      setIsPortfolioOpen(true)
      setIsAnalyticsOpen(false)
      setIsReportsOpen(false)
      setIsWatchlistOpen(false)
    } else if (pathname.startsWith('/watchlist')) {
      setIsWatchlistOpen(true)
      setIsAnalyticsOpen(false)
      setIsReportsOpen(false)
      setIsPortfolioOpen(false)
    }
  }, [pathname])

  const navItems = [
    { name: dict.sidebar.dashboard, href: '/', icon: LayoutDashboard },
    { 
      name: dict.sidebar.watchlist || 'Watchlist', 
      icon: Star,
      subItems: [
        { name: dict.sidebar.myWatchlist || 'My Watchlist', href: '/watchlist' },
        { name: dict.sidebar.priceAlerts || 'Price Alerts', href: '/watchlist/alerts' },
      ]
    },
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
          <h1 className={`text-3xl tracking-wide ${pacifico.className} text-gray-900 dark:text-white font-normal transition-colors duration-200`}>
            Track<span className="text-indigo-500">Folio</span>
          </h1>
        </Link>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          if (item.subItems) {
            const isActive = pathname.startsWith(
              item.name === dict.sidebar.reports ? '/reports' : 
              item.name === dict.sidebar.portfolio ? '/portfolio' : 
              item.name === (dict.sidebar.watchlist || 'Watchlist') ? '/watchlist' :
              '/analytics'
            )
            const isOpen = item.name === dict.sidebar.reports ? isReportsOpen : 
                           item.name === dict.sidebar.portfolio ? isPortfolioOpen :
                           item.name === (dict.sidebar.watchlist || 'Watchlist') ? isWatchlistOpen :
                           isAnalyticsOpen
            const toggleOpen = () => {
              if (item.name === dict.sidebar.reports) {
                setIsReportsOpen(!isReportsOpen)
                if (!isReportsOpen) {
                  setIsPortfolioOpen(false)
                  setIsAnalyticsOpen(false)
                  setIsWatchlistOpen(false)
                }
              } else if (item.name === dict.sidebar.portfolio) {
                setIsPortfolioOpen(!isPortfolioOpen)
                if (!isPortfolioOpen) {
                  setIsReportsOpen(false)
                  setIsAnalyticsOpen(false)
                  setIsWatchlistOpen(false)
                }
              } else if (item.name === (dict.sidebar.watchlist || 'Watchlist')) {
                setIsWatchlistOpen(!isWatchlistOpen)
                if (!isWatchlistOpen) {
                  setIsReportsOpen(false)
                  setIsAnalyticsOpen(false)
                  setIsPortfolioOpen(false)
                }
              } else {
                setIsAnalyticsOpen(!isAnalyticsOpen)
                if (!isAnalyticsOpen) {
                  setIsReportsOpen(false)
                  setIsPortfolioOpen(false)
                  setIsWatchlistOpen(false)
                }
              }
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

      {/* User Actions */}
      {user && (
        <div className="p-4 border-t border-gray-200/50 dark:border-slate-800 mt-auto relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center w-full bg-white/50 dark:bg-slate-800/50 rounded-xl p-2 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm mr-3 shadow-inner">
              {userInitial}
            </div>
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate w-full text-left">
                {userName}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate w-full text-left">
                {user.email}
              </span>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute bottom-full left-4 mb-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden transform origin-bottom-left transition-all animate-in fade-in zoom-in-95 z-50">
              <div className="p-2 space-y-1">
                <div className="px-3 py-2 flex items-center justify-between group">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center">
                    {mounted && theme === 'dark' ? (
                      <Moon className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 mr-2 text-amber-500" />
                    )}
                    {dict.common.appearance}
                  </span>
                  
                  {mounted && (
                    <div className="flex bg-gray-100 dark:bg-slate-900 rounded-lg p-0.5">
                      <button
                        onClick={() => setTheme('light')}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${theme === 'light' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-400'}`}
                      >
                        <Sun className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${theme === 'dark' ? 'bg-slate-700 text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-400'}`}
                      >
                        <Moon className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="px-3 py-2 flex items-center justify-between group">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center">
                    <Globe className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                    {dict.common.language}
                  </span>
                  <div className="flex bg-gray-100 dark:bg-slate-900 rounded-lg p-0.5">
                    <button
                      onClick={() => changeLanguage('en')}
                      disabled={isTransitioning}
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${dict.common.trackfolio === 'TrackFolio' ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => changeLanguage('bn')}
                      disabled={isTransitioning}
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${dict.common.trackfolio !== 'TrackFolio' ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                    >
                      BN
                    </button>
                  </div>
                </div>
                
                <div className="h-px bg-gray-100 dark:bg-slate-700 my-1 mx-2" />
                
                <form 
                  action={logout}
                  onSubmit={() => setIsLoggingOut(true)}
                >
                  <button
                    type="submit"
                    className="w-full text-left px-3 py-2 flex items-center text-xs font-bold text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    {dict.common.logout}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Logout Loading Overlay */}
      {isLoggingOut && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="flex flex-col items-center bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-slate-700">
            <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mb-2" />
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{dict?.sidebar?.loggingOut || 'Logging out...'}</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
