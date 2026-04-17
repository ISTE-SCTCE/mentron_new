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
    <div className="flex flex-col min-h-screen">
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

      {/* Feature Preview / Event Card */}
      <section className="px-8 pb-24 relative z-10">
        <div className="max-w-5xl mx-auto">
          {event && (
            <div className="glass p-12 rounded-[3rem] flex flex-col md:flex-row items-center gap-12 group">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-[1px] bg-blue-500"></span>
                  <span className="text-xs font-black tracking-widest text-blue-500 uppercase">Featured Event</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white group-hover:text-glow transition-all">
                  {event.title}
                </h2>
                <p className="text-gray-400 leading-relaxed text-lg">
                  {event.description || "Join us for an exclusive session featuring industry experts and hands-on workshops."}
                </p>
                <div className="flex items-center gap-6 text-sm text-gray-500 font-bold">
                  <span className="flex items-center gap-2">
                    <span className="text-blue-500">📍</span> {event.venue}
                  </span>
                  <span>|</span>
                  <span>FREE FOR MEMBERS</span>
                </div>
              </div>
              <div className="w-full md:w-1/3">
                <Link
                  href={`/events/${event.id}`}
                  className="w-full aspect-square glass glass-hover rounded-[2rem] flex flex-col items-center justify-center gap-4 text-center"
                >
                  <span className="text-5xl">⚡</span>
                  <span className="font-black text-white text-xl uppercase tracking-tighter">View Details</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

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