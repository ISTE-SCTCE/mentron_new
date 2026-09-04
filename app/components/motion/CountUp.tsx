'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useCountUp } from '@/app/lib/animations'

interface CountUpProps {
  value: number
  duration?: number
  className?: string
  suffix?: string
  prefix?: string
}

/**
 * Renders an animated count-up number.
 * Falls back to static number when prefers-reduced-motion is set.
 */
export function CountUp({ value, duration = 1200, className, suffix = '', prefix = '' }: CountUpProps) {
  const count = useCountUp(value, duration)

  return (
    <span className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}
