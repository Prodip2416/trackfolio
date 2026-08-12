'use client'

import { useState, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function GlobalLoader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Stop loader when navigation finishes (URL updates)
  useEffect(() => {
    setIsLoading(false)
  }, [pathname, searchParams])

  // Listen for manual trigger and Link clicks
  useEffect(() => {
    const handleStart = () => setIsLoading(true)
    const handleStop = () => setIsLoading(false)

    window.addEventListener('start-loading', handleStart)
    window.addEventListener('stop-loading', handleStop)

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')
      if (target && target.href && target.target !== '_blank' && !target.hasAttribute('download')) {
        const url = new URL(target.href)
        // Only trigger for internal links that actually change the route/params
        if (url.origin === window.location.origin && (url.pathname !== window.location.pathname || url.search !== window.location.search)) {
          setIsLoading(true)
        }
      }
    }
    
    document.addEventListener('click', handleClick, true)

    return () => {
      window.removeEventListener('start-loading', handleStart)
      window.removeEventListener('stop-loading', handleStop)
      document.removeEventListener('click', handleClick, true)
    }
  }, [])

  // Don't render anything during SSR
  if (!mounted || !isLoading) return null

  return (
    <div className="fixed top-16 left-64 right-0 bottom-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-[100] flex items-center justify-center transition-opacity duration-200">
      <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
    </div>
  )
}
