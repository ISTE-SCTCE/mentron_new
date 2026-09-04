'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from './lib/supabase/client'
import Link from 'next/link'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { Footer } from './components/Footer'
import { AboutSection } from './components/AboutSection'
import { MagneticButton } from './components/motion/MagneticButton'
import { staggerContainer, fadeInUp, fadeIn } from './lib/animations'

export default function Home() {
  const [event, setEvent] = useState<any>(null)
  const supabase = createClient()
  const prefersReduced = useReducedMotion()
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchEvent = async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .single()
      setEvent(data)
    }
    fetchEvent()
  }, [supabase])

  // Parallax scroll — orbs drift as user scrolls hero section
  const { scrollY } = useScroll()
  const orbY1 = useTransform(scrollY, [0, 600], [0, prefersReduced ? 0 : -80])
  const orbY2 = useTransform(scrollY, [0, 600], [0, prefersReduced ? 0 : 60])
  const orbY3 = useTransform(scrollY, [0, 600], [0, prefersReduced ? 0 : -40])

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-[#020204]">
      {/* Premium Background Aesthetic */}
      <div className="absolute inset-0 bg-[#020204] z-0" />

      {/* Dynamic Animated Mesh */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-transparent to-purple-900/20 pointer-events-none z-[1]" />

      {/* Parallax Orbs */}
      <motion.div
        style={{ y: orbY1 }}
        className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-blue-600/15 blur-[160px] pointer-events-none z-[2]"
      />
      <motion.div
        style={{ y: orbY2 }}
        className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-purple-600/15 blur-[160px] pointer-events-none z-[2]"
      />
      <motion.div
        style={{ y: orbY3 }}
        className="absolute top-[30%] left-[20%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[140px] pointer-events-none z-[2]"
      />

      {/* Grid Texture */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-[3]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020204]/40 to-[#020204]/90 pointer-events-none z-[4]" />

      {/* Navigation */}
      <nav className="py-6 px-4 md:px-8 flex justify-between items-center bg-transparent relative z-30">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-xl md:text-2xl font-black tracking-tighter text-white"
        >
          MENTRON
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex gap-4 md:gap-8 items-center"
        >
          <Link href="/login" className="text-xs md:text-sm font-bold text-gray-400 hover:text-white transition-all">
            Login
          </Link>
          <Link
            href="/signup"
            className="glass glass-hover px-4 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-bold text-white shadow-lg"
          >
            Join the Tribe
          </Link>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <main ref={heroRef} className="flex-1 flex flex-col justify-center items-center text-center px-4 sm:px-6 relative z-10 py-16 sm:py-20 lg:py-0">
        <motion.div
          className="max-w-4xl mx-auto space-y-8 sm:space-y-10"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeIn} className="inline-block px-4 py-2 glass rounded-full text-[9px] md:text-[10px] font-black tracking-[0.3em] text-cyan-400 uppercase mb-4 shadow-[0_0_20px_rgba(0,198,255,0.2)]">
            Engineering the Future
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white leading-[0.95]"
          >
            Connect. <br />
            <span className="text-glow text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">Learn.</span> <br />
            Innovate.
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-sm sm:text-base md:text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed px-2"
          >
            The elite community for tech enthusiasts, developers, and pioneers.
            Access exclusive resources, projects, and events.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-center pt-6 sm:pt-8 w-full sm:w-auto"
          >
            {/* Primary CTA — magnetic on desktop */}
            <MagneticButton strength={0.4}>
              <Link
                href="/login"
                className="block w-full sm:w-auto bg-white text-black hover:bg-gray-200 px-8 py-4 sm:px-10 sm:py-5 rounded-2xl sm:rounded-full font-black text-base sm:text-lg shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Get Started
              </Link>
            </MagneticButton>
            <Link
              href="/events"
              className="w-full sm:w-auto glass glass-hover border border-white/10 bg-white/5 px-8 py-4 sm:px-10 sm:py-5 rounded-2xl sm:rounded-full text-white font-black text-base sm:text-lg transition-all"
            >
              Explore Events
            </Link>
          </motion.div>

          <motion.div variants={fadeIn} className="pt-2 text-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-400 hover:text-white transition-colors duration-200 group"
            >
              <span>Not in the tribe?</span>
              <span className="text-cyan-400 group-hover:text-cyan-300 font-bold underline underline-offset-4 decoration-purple-500/50 group-hover:decoration-cyan-400">
                Join the tribe →
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </main>

      <AboutSection />
      <Footer />
    </div>
  )
}