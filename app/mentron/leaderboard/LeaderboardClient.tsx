'use client'

import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp, scaleIn } from '@/app/lib/animations'
import { CountUp } from '@/app/components/motion/CountUp'

interface Student {
  full_name: string | null
  roll_number: string | null
  department: string | null
  xp: number | null
}

export function LeaderboardClient({ students }: { students: Student[] }) {
  if (!students || students.length === 0) {
    return (
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        className="glass-card rounded-3xl p-12 text-center border-white/10 max-w-lg mx-auto"
      >
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        <h3 className="text-lg font-bold text-white mb-1">No Rankings Yet</h3>
        <p className="text-gray-400 text-xs sm:text-sm">As members propose event concepts and gather community votes, the top innovators will appear here.</p>
      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
      {/* Top 3 Podiums */}
      <motion.div
        className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-4 sm:mb-8 items-end"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {students.slice(0, 3).map((student, index) => (
          <motion.div
            key={index}
            variants={fadeInUp}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className={`glass-card p-6 sm:p-8 rounded-3xl text-center border-t-4 ${ 
              index === 0
                ? 'border-cyan-400 md:-translate-y-4 relative z-10 shadow-[0_0_40px_rgba(0,198,255,0.25)] bg-cyan-500/5'
                : index === 1
                ? 'border-purple-500 bg-purple-500/5 shadow-[0_0_30px_rgba(112,0,223,0.15)]'
                : 'border-indigo-500 bg-indigo-500/5'
            }`}
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.15 + 0.3, type: 'spring', stiffness: 300, damping: 15 }}
              className="text-3xl sm:text-4xl mb-3"
            >
              {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
            </motion.div>
            <h2 className="text-xl sm:text-2xl font-black text-white mb-1 truncate">{student.full_name || 'Member'}</h2>
            <p className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase mb-4 sm:mb-6">{student.department || 'Elite Member'}</p>
            <div className="text-3xl sm:text-4xl font-black text-white">
              <CountUp value={student.xp || 0} duration={1400 + index * 200} />
              {' '}<span className="text-xs uppercase tracking-widest text-cyan-400">VOTES</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Rankings Table */}
      <motion.div
        className="lg:col-span-3 glass-card rounded-3xl border-white/10 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-4 sm:p-6 text-[10px] font-black tracking-widest text-gray-400 uppercase">Rank</th>
                <th className="p-4 sm:p-6 text-[10px] font-black tracking-widest text-gray-400 uppercase">Student</th>
                <th className="p-4 sm:p-6 text-[10px] font-black tracking-widest text-gray-400 uppercase text-right">Votes</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.04, duration: 0.3, ease: 'easeOut' }}
                  className="group hover:bg-white/5 transition-all border-b border-white/5 last:border-0"
                >
                  <td className="p-4 sm:p-6">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                      index === 0 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                      index === 1 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      index === 2 ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                      'bg-white/5 text-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="p-4 sm:p-6">
                    <div className="flex flex-col">
                      <span className="text-white font-bold group-hover:text-cyan-300 transition-colors text-sm sm:text-base">{student.full_name || 'Member'}</span>
                      <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{student.roll_number || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-6 text-right">
                    <span className="text-base sm:text-lg font-black text-white">{student.xp || 0}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
