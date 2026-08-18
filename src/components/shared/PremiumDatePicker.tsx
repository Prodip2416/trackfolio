'use client'

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import SearchableDropdown from '@/components/shared/SearchableDropdown'

interface PremiumDatePickerProps {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  buttonClassName?: string
  placement?: 'top' | 'bottom'
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function PremiumDatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  className = '',
  buttonClassName = 'px-3 py-2 bg-white border rounded-lg shadow-sm text-sm font-medium min-h-[38px]',
  placement = 'bottom'
}: PremiumDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  
  // Date state
  const currentDate = value ? new Date(value) : new Date()
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth())
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear())

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        calendarRef.current &&
        !calendarRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const syncCalendarView = () => {
    if (value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        setCurrentMonth(d.getMonth())
        setCurrentYear(d.getFullYear())
      }
    }
  }

  useLayoutEffect(() => {
    if (!isOpen) return

    const updateCalendarPosition = () => {
      if (!dropdownRef.current) return

      const triggerRect = dropdownRef.current.getBoundingClientRect()
      const calendarRect = calendarRef.current?.getBoundingClientRect()
      const calendarWidth = calendarRect?.width ?? 300
      const calendarHeight = calendarRect?.height ?? 360
      const gap = 8
      const viewportPadding = 16
      const maxLeft = window.innerWidth - calendarWidth - viewportPadding
      const left = Math.max(viewportPadding, Math.min(triggerRect.left, maxLeft))

      const topPlacement = triggerRect.top - calendarHeight - gap
      const bottomPlacement = triggerRect.bottom + gap
      const hasTopSpace = topPlacement >= viewportPadding
      const hasBottomSpace = bottomPlacement + calendarHeight <= window.innerHeight - viewportPadding

      let top = placement === 'top' ? topPlacement : bottomPlacement

      if (placement === 'top' && !hasTopSpace && hasBottomSpace) {
        top = bottomPlacement
      }

      if (placement === 'bottom' && !hasBottomSpace && hasTopSpace) {
        top = topPlacement
      }

      top = Math.max(viewportPadding, Math.min(top, window.innerHeight - calendarHeight - viewportPadding))
      setCalendarPosition({ top, left })
    }

    updateCalendarPosition()
    window.addEventListener('resize', updateCalendarPosition)
    window.addEventListener('scroll', updateCalendarPosition, true)

    return () => {
      window.removeEventListener('resize', updateCalendarPosition)
      window.removeEventListener('scroll', updateCalendarPosition, true)
    }
  }, [isOpen, placement])

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day)
    const year = newDate.getFullYear()
    const month = String(newDate.getMonth() + 1).padStart(2, '0')
    const dayStr = String(newDate.getDate()).padStart(2, '0')
    onChange(`${year}-${month}-${dayStr}`)
    setIsOpen(false)
  }

  const generateDays = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()
    
    const days = []
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>)
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = value && 
        currentYear === parseInt(value.substring(0, 4)) && 
        currentMonth === parseInt(value.substring(5, 7)) - 1 &&
        i === parseInt(value.substring(8, 10))
        
      const isToday = 
        currentYear === new Date().getFullYear() &&
        currentMonth === new Date().getMonth() &&
        i === new Date().getDate()

      days.push(
        <button
          key={i}
          type="button"
          onClick={() => handleDateClick(i)}
          className={`w-8 h-8 flex items-center justify-center text-sm rounded-full transition-all 
            ${isSelected ? 'bg-indigo-600 text-white font-bold shadow-md' 
            : isToday ? 'bg-indigo-50 text-indigo-700 font-semibold' 
            : 'text-gray-700 hover:bg-gray-100'}`}
        >
          {i}
        </button>
      )
    }
    return days
  }

  // Format display text
  let displayText = placeholder
  if (value) {
    const parts = value.split('-')
    if(parts.length === 3) {
        const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]))
        displayText = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    }
  }

  // Generate year options (2025 to 2075)
  const yearOptions = Array.from({ length: 2075 - 2025 + 1 }, (_, i) => 2025 + i)
  const yearDropdownOptions = yearOptions.map(y => ({ label: String(y), value: String(y) }))

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          if (!isOpen) {
            syncCalendarView()
          }
          setIsOpen(!isOpen)
        }}
        className={`w-full flex items-center justify-between outline-none transition-all ${buttonClassName} ${
          isOpen ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-indigo-300'
        } ${!value ? 'text-gray-500' : 'text-gray-900'}`}
      >
        <div className="flex items-center space-x-2 overflow-hidden w-full">
          <CalendarIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <span className="truncate">{displayText}</span>
        </div>
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal((
        <div
          ref={calendarRef}
          className="fixed z-[60] bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] p-5 min-w-[320px]"
          style={{ top: calendarPosition.top, left: calendarPosition.left }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <button 
              type="button" 
              onClick={handlePrevMonth}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 font-bold text-gray-900 text-sm tracking-wide">
              <div className="relative">
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(Number(e.target.value))}
                  className="appearance-none bg-transparent hover:bg-gray-100 pl-2 pr-6 py-1.5 rounded-lg cursor-pointer outline-none font-bold text-gray-900 transition-colors"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
              </div>
              
              <div className="w-[100px]">
                <SearchableDropdown
                  options={yearDropdownOptions}
                  value={String(currentYear)}
                  onChange={(val) => setCurrentYear(Number(val))}
                  searchPlaceholder="Search year..."
                  buttonClassName="bg-transparent hover:bg-gray-100 px-2 py-1.5 rounded-lg font-bold text-gray-900 transition-colors border-none shadow-none min-h-0 !ring-0"
                />
              </div>
            </div>
            <button 
              type="button" 
              onClick={handleNextMonth}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="w-8 h-8 flex items-center justify-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {generateDays()}
          </div>
          
          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
             <button 
                type="button"
                onClick={() => {
                   const today = new Date();
                   const year = today.getFullYear();
                   const month = String(today.getMonth() + 1).padStart(2, '0');
                   const dayStr = String(today.getDate()).padStart(2, '0');
                   onChange(`${year}-${month}-${dayStr}`);
                   setCurrentYear(year);
                   setCurrentMonth(today.getMonth());
                   setIsOpen(false);
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
             >
                Today
             </button>
             <button 
                type="button"
                onClick={() => {
                   onChange('');
                   setIsOpen(false);
                }}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
             >
                Clear
             </button>
          </div>
        </div>
      ), document.body)}
    </div>
  )
}

