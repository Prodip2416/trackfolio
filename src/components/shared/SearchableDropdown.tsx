'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

type Option = {
  label: string
  value: string
}

interface SearchableDropdownProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  buttonClassName?: string
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  className = '',
  buttonClassName = 'px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium min-h-[38px]'
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${buttonClassName}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full min-w-[200px] mt-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-none rounded-lg focus:ring-0 outline-none"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-sm text-center text-gray-500 dark:text-gray-400">No results found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                    value === option.value ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                    setSearchQuery('')
                  }}
                >
                  <span className="truncate mr-2">{option.label}</span>
                  {value === option.value && <Check className="w-4 h-4 shrink-0 text-indigo-600" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
