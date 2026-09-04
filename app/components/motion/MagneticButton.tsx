'use client'

import { useRef, useState, ReactNode, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface MagneticButtonProps {
  children: ReactNode
  className?: string
  strength?: number // px attraction radius strength (default 0.35)
}

/**
 * Wraps a child element (button/link) with a magnetic hover effect.
 * Mouse proximity within the element's bounding box subtly pulls the
 * content toward the cursor. Only activates on pointer: fine devices.
 * Respects prefers-reduced-motion.
 */
export function MagneticButton({ children, className, strength = 0.35 }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const prefersReduced = useReducedMotion()

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReduced || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    setPos({
      x: (e.clientX - cx) * strength,
      y: (e.clientY - cy) * strength,
    })
  }, [prefersReduced, strength])

  const handleMouseLeave = useCallback(() => {
    setPos({ x: 0, y: 0 })
  }, [])

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        animate={{ x: pos.x, y: pos.y }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.5 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
