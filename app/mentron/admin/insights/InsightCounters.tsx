'use client'

import { motion } from 'framer-motion'
import { staggerContainer, subtleReveal } from '@/app/lib/animations'
import { CountUp } from '@/app/components/motion/CountUp'

interface InsightCountersProps {
  totalLogs: number
  downloadLogs: number
  viewLogs: number
}

export function InsightCounters({ totalLogs, downloadLogs, viewLogs }: InsightCountersProps) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={subtleReveal} className="glass-card p-5 rounded-2xl border-white/10">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#8b9bb4] mb-1">
          Total Events (Last 100)
        </p>
        <p className="text-2xl sm:text-3xl font-black text-white font-space-grotesk">
          <CountUp value={totalLogs} duration={900} />
        </p>
      </motion.div>
      <motion.div variants={subtleReveal} className="glass-card p-5 rounded-2xl border-cyan-500/20">
        <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-1">
          Resource Downloads
        </p>
        <p className="text-2xl sm:text-3xl font-black text-cyan-400 font-space-grotesk">
          <CountUp value={downloadLogs} duration={1100} />
        </p>
      </motion.div>
      <motion.div variants={subtleReveal} className="glass-card p-5 rounded-2xl border-purple-500/20">
        <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-1">
          Resource Views / Reads
        </p>
        <p className="text-2xl sm:text-3xl font-black text-purple-400 font-space-grotesk">
          <CountUp value={viewLogs} duration={1300} />
        </p>
      </motion.div>
    </motion.div>
  )
}
