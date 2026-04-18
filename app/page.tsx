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
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-[#030305]">
      {/* Background Overlay - Solid Aesthetic */}
      <div className="absolute inset-0 bg-[#030305] z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/5 pointer-events-none z-[1]" />

      {/* Navigation */}
      <nav className="py-4 px-8 flex justify-between items-center bg-transparent relative z-20">
        <div className="text-2xl font-black tracking-tighter text-white">MENTRON</div>
        <div className="flex gap-8 items-center">
          <Link href="/login" className="text-sm font-bold text-gray-400 hover:text-white transition-all">
            Login
          </Link>
          <Link
            href="/signup"
            className="glass glass-hover px-6 py-2.5 rounded-full text-sm font-bold text-white shadow-lg"
          >
            Join the Club
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center text-center px-4 relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-block px-4 py-1.5 glass rounded-full text-[10px] font-black tracking-[0.2em] text-blue-400 uppercase mb-4 animate-fade-in">
            Engineering the Future
          </div>

          <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white leading-[0.9] animate-slide-up">
            Connect. <br />
            <span className="text-glow text-blue-600">Learn.</span> <br />
            Innovate.
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed animate-fade-in-delayed">
            The elite community for tech enthusiasts, developers, and pioneers.
            Access exclusive resources, projects, and events.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 animate-fade-in-delayed">
            <Link
              href="/signup"
              className="bg-white text-black hover:bg-gray-200 px-10 py-5 rounded-full font-black text-lg shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 transition-all duration-300"
            >
              Get Started
            </Link>
            <Link
              href="/events"
              className="glass glass-hover px-10 py-5 rounded-full text-white font-black text-lg"
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