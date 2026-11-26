'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Loader2 } from 'lucide-react'
import SearchableDropdown from '@/components/shared/SearchableDropdown'

export type YearOption = { value: string; label: string; disabled?: boolean; keywords?: string }

/**
 * Year filter ("All time" or one year) built on the shared SearchableDropdown (same as History's
 * year filter). Navigates to ?year= so the page stays server-rendered.
 */
export default function YearSelect({
  options, value, basePath, searchPlaceholder, noResultsText
}: {
  options: YearOption[]
  value: string
  basePath: string
  searchPlaceholder: string
  noResultsText: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <SearchableDropdown
      options={options}
      value={value}
      onChange={v => {
        if (v === value) return
        startTransition(() => router.push(v === 'all' ? basePath : `${basePath}?year=${v}`))
      }}
      searchPlaceholder={searchPlaceholder}
      noResultsText={noResultsText}
      testId="returns-year-select"
      icon={
        pending
          ? <Loader2 className="w-4 h-4 shrink-0 animate-spin text-indigo-600 dark:text-indigo-400" />
          : <CalendarDays className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
      }
      className="w-full sm:w-48 self-start sm:self-auto"
      buttonClassName="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm text-sm font-semibold min-h-[38px] hover:border-indigo-300 dark:hover:border-indigo-600"
    />
  )
}
