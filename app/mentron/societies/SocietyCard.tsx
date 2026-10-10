'use client'

import { motion } from 'framer-motion'
import { fadeInUp, scaleIn } from '@/app/lib/animations'

interface Society {
  name: string
  full: string
  desc: string
  logo: string
  color: string
  href: string
}

export function SocietyCard({ soc, index }: { soc: Society; index: number }) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      custom={index}
      className="w-full max-w-3xl"
    >
      <motion.a
        href={soc.href}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="glass glass-hover p-6 sm:p-10 md:p-16 rounded-3xl md:rounded-[3rem] flex flex-col items-center text-center group relative overflow-hidden border border-white/10 hover:border-cyan-400/40 block"
      >
        {/* Pulsing background glow — framer-motion loop instead of CSS animate-pulse */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 blur-[120px] rounded-full"
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 3.5, ease: 'easeInOut', repeat: Infinity }}
        />

        {/* Logo — subtle hover parallax */}
        <div className="relative z-10 w-full mb-8 sm:mb-12">
          <motion.img
            src={soc.logo}
            alt={soc.name}
            className="h-20 sm:h-28 md:h-32 mx-auto object-contain drop-shadow-[0_0_30px_rgba(0,198,255,0.3)] filter brightness-110"
            whileHover={{ scale: 1.08, y: -4 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          />
          <p className="text-cyan-400 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] mt-6 text-glow">
            {soc.full}
          </p>
        </div>

        <p className="relative z-10 text-gray-300 font-medium leading-relaxed text-sm sm:text-base md:text-lg mb-8 sm:mb-12 max-w-xl mx-auto">
          {soc.desc}
        </p>

        <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-center w-full justify-center">
          <motion.span
            whileHover={{ backgroundColor: 'rgba(255,255,255,1)', color: '#000' }}
            transition={{ duration: 0.2 }}
            className="w-full sm:w-auto glass glass-hover px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-xs font-black tracking-[0.2em] text-white uppercase border border-white/10 shadow-lg cursor-pointer"
          >
            Join {soc.name} Community →
          </motion.span>
        </div>
      </motion.a>
    </motion.div>
  )
}
