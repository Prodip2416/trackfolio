'use client'

import { useEffect, useRef } from 'react'
import { motion, useInView, useSpring, useTransform } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

export default function AnimatedCounter({ 
  value, 
  prefix = '', 
  suffix = '', 
  decimals = 0,
  className = ''
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  // Trigger animation when the element comes into view
  const inView = useInView(ref, { once: true, margin: "0px" })
  
  // Spring configuration for smooth counting
  const springValue = useSpring(0, {
    stiffness: 70,
    damping: 25,
    mass: 1
  })

  useEffect(() => {
    if (inView) {
      springValue.set(value)
    }
  }, [springValue, value, inView])

  // Transform the raw spring number into a formatted string
  const display = useTransform(springValue, (current) => {
    const isNegative = current < 0
    const absoluteVal = Math.abs(current)
    const formattedNum = absoluteVal.toLocaleString(undefined, { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    })
    return `${isNegative ? '-' : ''}${prefix}${formattedNum}${suffix}`
  })

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  )
}
