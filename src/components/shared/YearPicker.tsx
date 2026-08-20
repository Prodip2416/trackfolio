'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface YearPickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  buttonClassName?: string
  minYear?: number
  maxYear?: number
}

export default function YearPicker({
  value,
  onChange,
  placeholder = 'Select Year',
  className = '',
  buttonClassName = 'px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium min-h-[38px]',
  minYear = 2010,
  maxYear = 2075
}: YearPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const selectedYear = value ? parseInt(value, 10) : NaN
  const [rangeStart, setRangeStart] = useState(() => {
    const base = isNaN(selectedYear) ? new Date().getFullYear() : selectedYear
    return Math.floor(base / 16) * 16
  })

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        btnRef.current && !btnRef.current.contains(target) &&
        popupRef.current && !popupRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isOpen || !btnRef.current || !popupRef.current) return

    const update = () => {
      if (!btnRef.current || !popupRef.current) return
      const rect = btnRef.current.getBoundingClientRect()
      const popRect = popupRef.current.getBoundingClientRect()
      const gap = 8
      const pad = 12

      let left = rect.left
      const maxLeft = window.innerWidth - popRect.width - pad
      left = Math.max(pad, Math.min(left, maxLeft))

      let top = rect.bottom + gap
      if (top + popRect.height > window.innerHeight - pad) {
        top = rect.top - popRect.height - gap
      }
      top = Math.max(pad, top)
      setPos({ top, left })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [isOpen, rangeStart])

  const totalYears = maxYear - minYear + 1
  const cols = 4
  const rows = 4
  const perPage = cols * rows

  const handleSelect = (year: number) => {
    onChange(year.toString())
    setIsOpen(false)
  }

  const generateYears = () => {
    const years: React.ReactNode[] = []
    for (let i = 0; i < perPage; i++) {
      const y = rangeStart + i
      const isEnabled = y >= minYear && y <= maxYear
      const isSelected = y === selectedYear
      years.push(
        <button
          key={y}
          type="button"
          disabled={!isEnabled}
          onClick={() => isEnabled && handleSelect(y)}
          className={`h-10 rounded-lg text-sm font-semibold transition-all
            ${!isEnabled ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' :
              isSelected ? 'bg-indigo-600 text-white shadow-md' :
              'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          {y}
        </button>
      )
    }
    return years
  }

  const displayText = value || placeholder
  const hasValue = !!value

  return (
    <div className={`relative ${className}`} ref={btnRef}>
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            setIsOpen(false)
          } else {
            if (!isNaN(selectedYear)) {
              setRangeStart(Math.floor(selectedYear / perPage) * perPage)
            }
            setIsOpen(true)
          }
        }}
        className={`w-full flex items-center justify-between outline-none transition-all ${buttonClassName} ${
          isOpen ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-indigo-300 dark:border-gray-600'
        } ${!hasValue ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}
      >
        <span className="truncate">{displayText}</span>
        <ChevronRight className={`w-4 h-4 ml-2 text-gray-400 dark:text-gray-500 -rotate-90 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal((
        <div
          ref={popupRef}
          className="fixed z-[60] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] p-4 w-[260px]"
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setRangeStart(rs => Math.max(minYear, rs - perPage))}
              disabled={rangeStart - perPage < minYear - perPage}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-sm font-bold text-gray-900 dark:text-white tracking-wide">
              {rangeStart} - {rangeStart + perPage - 1}
            </div>
            <button
              type="button"
              onClick={() => setRangeStart(rs => Math.min(maxYear, rs + perPage))}
              disabled={rangeStart + perPage > maxYear}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {generateYears()}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
            <button
              type="button"
              onClick={() => {
                const y = new Date().getFullYear()
                onChange(y.toString())
                setIsOpen(false)
              }}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
            >
              Current Year
            </button>
          </div>
        </div>
      ), document.body)}
    </div>
  )
}
