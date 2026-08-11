'use client'

import { User } from '@supabase/supabase-js'
import { logout } from '@/app/auth/actions'
import { setLanguage } from '@/app/actions/i18n'
import { LogOut, ChevronRight, RefreshCw, Sun, Moon, User as UserIcon, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect, useTransition } from 'react'
import toast from 'react-hot-toast'
import { useTheme } from 'next-themes'

export default function Topbar({ user, title, lastSyncTime, dict }: { user: User, title: string, lastSyncTime?: string | null, dict: any }) {
  const [isPending, setIsPending] = useState(false)
  const [isTransitioning, startTransition] = useTransition()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const router = useRouter()
  const profileRef = useRef<HTMLDivElement>(null)
  
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

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

  const handleSync = async () => {
    if (isPending) return
    setIsPending(true)
    
    const syncPromise = fetch('/api/sync', { method: 'POST' }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to sync prices')
      }
      router.refresh()
      return res.json()
    }).finally(() => {
      setIsPending(false)
    })

    toast.promise(
      syncPromise,
      {
        loading: `${dict.common.syncing}`,
        success: 'Prices synced successfully!',
        error: (err) => err.message
      }
    )
  }

  const changeLanguage = (lang: 'en' | 'bn') => {
    startTransition(async () => {
      await setLanguage(lang)
      router.refresh()
    })
  }

  const userInitial = (user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  return (
    <div className="h-16 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl backdrop-saturate-150 border-b border-gray-200/50 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm print:hidden transition-colors duration-200">
      
      {/* Breadcrumb */}
      <div className="flex items-center text-sm font-medium w-1/3">
        <span className="text-gray-400 dark:text-gray-500">{dict.common.trackfolio}</span>
        <ChevronRight className="w-4 h-4 mx-2 text-gray-300 dark:text-gray-600" />
        <span className="text-gray-800 dark:text-gray-200 font-bold">{title}</span>
      </div>

      {/* Sync Button (Center) */}
      <div className="flex items-center justify-center space-x-4 w-1/3">
        {lastSyncTime && (
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">{dict.common.lastSynced}</p>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
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
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-70 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
          {isPending ? dict.common.syncing : dict.common.syncWithDse}
        </button>
      </div>

      {/* User Actions */}
      <div className="flex items-center justify-end space-x-4 w-1/3 relative" ref={profileRef}>
        <button 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center bg-white/80 dark:bg-slate-800/80 rounded-full pl-2 pr-4 py-1.5 border border-gray-200 dark:border-slate-700 shadow-sm backdrop-blur-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xs mr-2.5 shadow-inner">
            {userInitial}
          </div>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200 hidden sm:block max-w-[120px] truncate">
            {userName}
          </span>
        </button>

        {/* Dropdown Menu */}
        {isProfileOpen && (
          <div className="absolute top-12 right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.user_metadata?.full_name || 'TrackFolio User'}</p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate mt-0.5">{user.email}</p>
            </div>
            
            <div className="p-2 space-y-1">
              <div className="px-3 py-2 flex items-center justify-between group">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  {mounted && theme === 'dark' ? (
                    <Moon className="w-4 h-4 mr-2.5 text-indigo-500" />
                  ) : (
                    <Sun className="w-4 h-4 mr-2.5 text-amber-500" />
                  )}
                  {dict.common.appearance}
                </span>
                
                {mounted && (
                  <div className="flex bg-gray-100 dark:bg-slate-900 rounded-lg p-0.5">
                    <button
                      onClick={() => setTheme('light')}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${theme === 'light' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-400'}`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${theme === 'dark' ? 'bg-slate-700 text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-400'}`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="px-3 py-2 flex items-center justify-between group">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Globe className="w-4 h-4 mr-2.5 text-emerald-500" />
                  {dict.common.language}
                </span>
                <div className="flex bg-gray-100 dark:bg-slate-900 rounded-lg p-0.5">
                  <button
                    onClick={() => changeLanguage('en')}
                    disabled={isTransitioning}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${dict.common.trackfolio === 'TrackFolio' ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => changeLanguage('bn')}
                    disabled={isTransitioning}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${dict.common.trackfolio !== 'TrackFolio' ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  >
                    BN
                  </button>
                </div>
              </div>
              
              <div className="h-px bg-gray-100 dark:bg-slate-700 my-1 mx-2" />
              
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full text-left px-3 py-2 flex items-center text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2.5" />
                  {dict.common.logout}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      
    </div>
  )
}
