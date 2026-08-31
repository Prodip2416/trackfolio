'use client'

import { usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function Loading() {
  const pathname = usePathname()
  
  const isAuthRoute = pathname === '/login' || pathname === '/signup'

  if (isAuthRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    )
  }

  return (
    <div className="flex-grow pt-[10px] pb-5 pl-[15px] pr-[10px]">
          <div className="space-y-6">
            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-4 flex flex-col justify-between shadow-sm animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="h-3 w-16 bg-gray-200 dark:bg-slate-800 rounded" />
                  <div className="h-6 w-24 bg-gray-200 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>

            {/* Chart/Table Skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 flex flex-col shadow-sm animate-pulse delay-100">
                <div className="h-6 w-48 bg-gray-200 dark:bg-slate-800 rounded mb-6" />
                <div className="flex-1 bg-gray-100 dark:bg-slate-800/50 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
              </div>
              <div className="h-96 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 flex flex-col shadow-sm animate-pulse delay-150">
                <div className="h-6 w-32 bg-gray-200 dark:bg-slate-800 rounded mb-6" />
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-10 bg-gray-100 dark:bg-slate-800/50 rounded-lg w-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
    </div>
  )
}
