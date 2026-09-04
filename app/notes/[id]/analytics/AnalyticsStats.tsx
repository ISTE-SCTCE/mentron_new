'use client'

import { motion } from 'framer-motion'
import { staggerContainer, subtleReveal } from '@/app/lib/animations'
import { CountUp } from '@/app/components/motion/CountUp'

interface AnalyticsStatsProps {
  totalViews: number
  uniqueViewers: number
}

export function AnalyticsStats({ totalViews, uniqueViewers }: AnalyticsStatsProps) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        variants={subtleReveal}
        className="glass-card p-6 sm:p-8 rounded-3xl flex flex-col items-center justify-center text-center border-white/10"
      >
        <span className="text-4xl sm:text-5xl font-black text-white">
          <CountUp value={totalViews} duration={1000} />
        </span>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Total Views</span>
      </motion.div>
      <motion.div
        variants={subtleReveal}
        className="glass-card p-6 sm:p-8 rounded-3xl flex flex-col items-center justify-center text-center border-white/10"
      >
        <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
          <CountUp value={uniqueViewers} duration={1200} />
        </span>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Unique Viewers</span>
      </motion.div>
    </motion.div>
  )
}
