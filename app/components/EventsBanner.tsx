'use client'

import { useEffect, useRef, useState } from 'react'

interface Event {
    id: string
    event_name: string
    venue?: string
    date?: string
    description?: string
}

interface Props {
    events: Event[]
}

const FALLBACK_EVENTS: Event[] = [
    { id: '1', event_name: 'Tech Symposium 2025', venue: 'Main Auditorium', description: 'An immersive deep dive into emerging technologies and innovation.' },
    { id: '2', event_name: 'Workshop: AI & ML', venue: 'CS Seminar Hall', description: 'Hands-on machine learning session with industry mentors.' },
    { id: '3', event_name: 'Hackathon Season IV', venue: 'Innovation Lab', description: '24-hour intense coding challenge. Build, learn, and win.' },
]

// A set of vivid gradient pairs to cycle across cards
const GRADIENTS = [
    'from-blue-900/80 via-indigo-900/60 to-transparent',
    'from-purple-900/80 via-violet-900/60 to-transparent',
    'from-cyan-900/80 via-sky-900/60 to-transparent',
    'from-rose-900/80 via-pink-900/60 to-transparent',
    'from-emerald-900/80 via-teal-900/60 to-transparent',
]

const ACCENT_COLORS = [
    'text-blue-400 border-blue-500/40',
    'text-purple-400 border-purple-500/40',
    'text-cyan-400 border-cyan-500/40',
    'text-rose-400 border-rose-500/40',
    'text-emerald-400 border-emerald-500/40',
]

const DOT_COLORS = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-cyan-500',
    'bg-rose-500',
    'bg-emerald-500',
]

export function EventsBanner({ events }: Props) {
    const displayEvents = events.length > 0 ? events : FALLBACK_EVENTS
    const [active, setActive] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const startSlider = () => {
        intervalRef.current = setInterval(() => {
            setActive(prev => (prev + 1) % displayEvents.length)
        }, 4000)
    }

    const stopSlider = () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
    }

    useEffect(() => {
        if (!isPaused) startSlider()
        else stopSlider()
        return () => stopSlider()
    }, [isPaused, displayEvents.length])

    const currentEvent = displayEvents[active]
    const gradient = GRADIENTS[active % GRADIENTS.length]
    const accent = ACCENT_COLORS[active % ACCENT_COLORS.length]
    const dot = DOT_COLORS[active % DOT_COLORS.length]

    return (
        <section
            className="relative w-full min-h-[60vh] md:min-h-[80vh] overflow-hidden flex items-end pt-24 pb-12 md:pb-20 px-4 md:px-12"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* ── Dynamic Background: parallax gradient ── */}
            <div
                className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-all duration-1000`}
            />

            {/* ── Grid overlay texture ── */}
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 40px,white 40px,white 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,white 40px,white 41px)',
                }}
            />

            {/* ── Animated orb ── */}
            <div className={`absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-[160px] opacity-25 transition-all duration-1000 ${dot}`} />

            {/* ── LIVE badge ── */}
            <div className="absolute top-28 md:top-36 left-4 md:left-12 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${dot}`} />
                <span className="text-[9px] font-black tracking-[0.35em] text-white/60 uppercase">Upcoming Event</span>
            </div>

            {/* ── Count indicator ── */}
            <div className="absolute top-28 md:top-36 right-4 md:right-12 text-right">
                <span className="text-[10px] font-black text-white/30 tracking-widest">
                    {String(active + 1).padStart(2, '0')} / {String(displayEvents.length).padStart(2, '0')}
                </span>
            </div>

            {/* ── Main Content ── */}
            <a
                href="https://istesctce.in/events.html"
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-10 w-full max-w-5xl group cursor-pointer"
                style={{ transition: 'opacity 0.7s ease' }}
            >
                {/* Sub-label */}
                <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-6 transition-all duration-700 ${accent.split(' ')[0]}`}>
                    {currentEvent.venue ? `📍 ${currentEvent.venue}` : 'ISTE SCTCE'}
                </p>

                {/* Large Event Name */}
                <h2
                    key={active}
                    className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-none mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                    {currentEvent.event_name}
                </h2>

                {/* Description */}
                <p
                    key={`desc-${active}`}
                    className="text-gray-300 text-base md:text-lg max-w-2xl leading-relaxed mb-10 animate-in fade-in duration-1000"
                >
                    {currentEvent.description || 'An unforgettable event experience crafted for the SCTCE tech community.'}
                </p>

                {/* CTA arrows */}
                <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest px-8 py-4 rounded-2xl border glass group-hover:bg-white group-hover:text-black transition-all duration-300 ${accent}`}>
                        Explore All Events
                        <span className="inline-block group-hover:translate-x-2 transition-transform duration-300">→</span>
                    </span>
                </div>
            </a>

            {/* ── Slide Dot Navigation ── */}
            <div className="absolute bottom-6 md:bottom-10 right-4 md:right-12 flex items-center gap-3 z-10">
                {displayEvents.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => { setActive(i); stopSlider(); setTimeout(startSlider, 100) }}
                        className={`rounded-full transition-all duration-500 ${i === active
                            ? `w-8 h-2 ${dot}`
                            : 'w-2 h-2 bg-white/20 hover:bg-white/50'
                        }`}
                        aria-label={`Go to event ${i + 1}`}
                    />
                ))}
            </div>

            {/* ── Bottom fade-to-background ── */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        </section>
    )
}
