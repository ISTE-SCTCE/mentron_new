'use client'

import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp, scaleIn } from '@/app/lib/animations'

interface Member {
  full_name: string | null
  department: string | null
  role: string | null
  xp: number | null
  roll_number: string | null
}

interface TeamGridProps {
  members: Member[]
  maxXp: number
}

export function TeamGrid({ members, maxXp }: TeamGridProps) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-6 sm:gap-8"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {members?.map((member, index) => {
        const xp = member.xp || 0
        const xpPct = maxXp > 0 ? Math.round((xp / maxXp) * 100) : 0

        return (
          <motion.div
            key={index}
            variants={fadeInUp}
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="glass glass-hover p-6 sm:p-8 rounded-3xl text-center group flex flex-col items-center cursor-pointer"
          >
            {/* Avatar frame */}
            <motion.div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden mb-5 border border-white/10 group-hover:border-cyan-400/50 transition-all p-1.5 bg-white/5 shadow-inner"
              whileHover={{ borderColor: 'rgba(34,211,238,0.5)' }}
            >
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.full_name || 'Member')}`}
                alt={member.full_name || 'Member'}
                className="w-full h-full object-cover rounded-xl"
              />
            </motion.div>

            <h2 className="text-lg sm:text-xl font-black text-white mb-1 group-hover:text-glow transition-all line-clamp-1">
              {member.full_name}
            </h2>
            <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              {member.role === 'core' ? 'Core Member' : 'Executive Member'}
            </p>

            <div className="mt-auto space-y-3 w-full">
              <div className="px-3 py-1.5 glass rounded-full text-[9px] font-black tracking-widest text-gray-300 uppercase truncate">
                {(member.department || 'General')}
              </div>

              {/* Animated XP bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">XP</span>
                  <span className="text-[10px] font-bold text-purple-400/80 uppercase tracking-[0.25em]">{xp}</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-600 to-cyan-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: index * 0.04 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}

      {members?.length === 0 && (
        <motion.div
          variants={scaleIn}
          className="col-span-full py-16 px-6 glass rounded-3xl text-center space-y-4 border border-white/5"
        >
          <svg className="w-12 h-12 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg font-black text-white">No Executive Members Found</h3>
          <p className="text-gray-400 text-xs sm:text-sm font-medium">Leadership team roster will appear here once updated.</p>
        </motion.div>
      )}
    </motion.div>
  )
}
