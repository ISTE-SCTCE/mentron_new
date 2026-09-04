'use client'

import { useRef, ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { fadeInUp } from '@/app/lib/animations'

interface ScrollRevealProps {
  children: ReactNode
  delay?: number
  className?: string
  /** Use subtleReveal (10px) instead of full fadeInUp (24px) for dense contexts */
  subtle?: boolean
}

export function ScrollReveal({ children, delay = 0, className, subtle = false }: ScrollRevealProps) {
  const prefersReduced = useReducedMotion()

  const variant = subtle
    ? {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut', delay } },
      }
    : {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const, delay } },
      }

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={variant}
    >
      {children}
    </motion.div>
  )
}
