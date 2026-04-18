'use client'

import { useEffect, useState } from 'react'
import { createClient } from './lib/supabase/client'
import Link from 'next/link'
import { Footer } from './components/Footer'
import { AboutSection } from './components/AboutSection'

export default function Home() {
  const [event, setEvent] = useState<any>(null)
  const supabase = createClient()
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

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-[#020204]">
      {/* Premium Background Aesthetic */}
      <div className="absolute inset-0 bg-[#020204] z-0" />
      
      {/* Dynamic Animated Mesh */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-transparent to-purple-900/20 pointer-events-none z-[1]" />
      
      {/* Animated Orbs - Enhanced for Vibrancy */}
      <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-blue-600/15 blur-[160px] animate-pulse pointer-events-none z-[2]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-purple-600/15 blur-[160px] animate-pulse pointer-events-none z-[2]" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[140px] animate-pulse pointer-events-none z-[2]" style={{ animationDelay: '4s' }} />

      {/* Grid Texture */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-[3]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020204]/40 to-[#020204]/90 pointer-events-none z-[4]" />

      {/* Navigation */}
      <nav className="py-6 px-4 md:px-8 flex justify-between items-center bg-transparent relative z-30">
        <div className="text-xl md:text-2xl font-black tracking-tighter text-white">MENTRON</div>
        <div className="flex gap-4 md:gap-8 items-center">
          <Link href="/login" className="text-xs md:text-sm font-bold text-gray-400 hover:text-white transition-all">
            Login
          </Link>
          <Link
            href="/signup"
            className="glass glass-hover px-4 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-bold text-white shadow-lg"
          >
            Join the Club
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center text-center px-6 relative z-10 py-20 lg:py-0">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="inline-block px-4 py-2 glass rounded-full text-[9px] md:text-[10px] font-black tracking-[0.3em] text-blue-400 uppercase mb-4 animate-fade-in shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            Engineering the Future
          </div>

          <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-white leading-[0.95] animate-slide-up">
            Connect. <br />
            <span className="text-glow text-blue-600">Learn.</span> <br />
            Innovate.
          </h1>

          <p className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed animate-fade-in-delayed">
            The elite community for tech enthusiasts, developers, and pioneers.
            Access exclusive resources, projects, and events.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center pt-8 animate-fade-in-delayed">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-white text-black hover:bg-gray-200 px-8 py-4 sm:px-10 sm:py-5 rounded-3xl sm:rounded-full font-black text-base sm:text-lg shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 transition-all duration-300"
            >
              Get Started
            </Link>
            <Link
              href="/events"
              className="w-full sm:w-auto glass border border-white/10 bg-white/5 px-8 py-4 sm:px-10 sm:py-5 rounded-3xl sm:rounded-full text-white font-black text-base sm:text-lg hover:bg-white/10 transition-all"
            >
              Explore Events
            </Link>
          </div>
        </div>
      </main>

      <AboutSection />
      <Footer />

      {/* Animation Overrides */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
        .animate-slide-up { animation: slide-up 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-fade-in-delayed { animation: fade-in 1s ease-out 0.5s forwards; opacity: 0; }
      `}</style>
    </div>
  )
}