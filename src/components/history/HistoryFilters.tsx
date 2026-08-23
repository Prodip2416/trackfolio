'use client'

import { Filter } from 'lucide-react'
import SearchableDropdown from '@/components/shared/SearchableDropdown'

interface HistoryFiltersProps {
  stockOptions: { label: string, value: string }[]
  yearOptions: { label: string, value: string }[]
  monthOptions: { label: string, value: string }[]
  filterStock: string
  setFilterStock: (val: string) => void
  filterYear: string
  setFilterYear: (val: string) => void
  filterMonth: string
  setFilterMonth: (val: string) => void
  totalRecords: number
}

export default function HistoryFilters({
  stockOptions,
  yearOptions,
  monthOptions,
  filterStock,
  setFilterStock,
  filterYear,
  setFilterYear,
  filterMonth,
  setFilterMonth,
  totalRecords
}: HistoryFiltersProps) {
  return (
    <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 rounded-t-2xl flex flex-row flex-wrap justify-between items-center gap-3 relative z-30 transition-colors shrink-0">
      <div className="flex flex-wrap items-center gap-2">
        <div className="hidden sm:flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-400">
          <Filter className="w-3.5 h-3.5" />
        </div>
        
        <div className="w-[150px] sm:w-[170px]">
          <SearchableDropdown
            options={stockOptions}
            value={filterStock}
            onChange={setFilterStock}
            placeholder="All Stocks"
            searchPlaceholder="Search stock..."
            buttonClassName="px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-xs font-medium min-h-[34px]"
          />
        </div>

        <div className="w-[120px] sm:w-[130px]">
          <SearchableDropdown
            options={yearOptions}
            value={filterYear}
            onChange={setFilterYear}
            placeholder="All Years"
            searchPlaceholder="Search year..."
            buttonClassName="px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-xs font-medium min-h-[34px]"
          />
        </div>

        <div className="w-[135px] sm:w-[145px]">
          <SearchableDropdown
            options={monthOptions}
            value={filterMonth}
            onChange={setFilterMonth}
            placeholder="All Months"
            searchPlaceholder="Search month..."
            buttonClassName="px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-xs font-medium min-h-[34px]"
          />
        </div>

        {(filterStock !== 'ALL' || filterYear !== 'ALL' || filterMonth !== 'ALL') && (
          <button 
            onClick={() => {
              setFilterStock('ALL')
              setFilterYear('ALL')
              setFilterMonth('ALL')
            }}
            className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm transition-colors">
        Records: <span className="text-gray-900 dark:text-white">{totalRecords}</span>
      </div>
    </div>
  )
}
