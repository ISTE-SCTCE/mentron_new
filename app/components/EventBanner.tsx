'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import Link from 'next/link'

interface CalEvent {
    id: string
    event_name: string
    event_date: string
    venue?: string
}

const GRADIENTS = [
    'from-[#1a0533] via-[#3d1a7a] to-[#6b3fa0]',
    'from-[#031a33] via-[#0a3d7a] to-[#1565c0]',
    'from-[#0d2818] via-[#1a5c35] to-[#2e7d52]',
    'from-[#330d0d] via-[#7a1a1a] to-[#c0392b]',
    'from-[#1a1200] via-[#7a5600] to-[#b08000]',
    'from-[#001a2e] via-[#003366] to-[#0055a4]',
]

const GLOWS = [
    'shadow-purple-900/40',
    'shadow-blue-900/40',
    'shadow-green-900/40',
    'shadow-red-900/40',
    'shadow-yellow-900/40',
    'shadow-blue-900/40',
]

const EMOJIS = ['⚡', '🎯', '🚀', '🏆', '🎓', '🌟']

function getDaysUntil(dateStr: string): { label: string; color: string } {
    try {
        const date = new Date(dateStr)
        const diff = Math.ceil((date.getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))
        if (diff === 0) return { label: 'TODAY', color: 'text-red-400 border-red-400/40 bg-red-400/10' }
        if (diff === 1) return { label: 'TOMORROW', color: 'text-orange-400 border-orange-400/40 bg-orange-400/10' }
        if (diff <= 3) return { label: `IN ${diff} DAYS`, color: 'text-amber-400 border-amber-400/40 bg-amber-400/10' }
        if (diff <= 7) return { label: `IN ${diff} DAYS`, color: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10' }
        if (diff < 0) return { label: 'PAST', color: 'text-gray-500 border-gray-500/40 bg-gray-500/10' }
        return { label: `IN ${diff} DAYS`, color: 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10' }
    } catch {
        return { label: '', color: '' }
    }
}

function formatDate(dateStr: string) {
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })
    } catch { return dateStr }
}

export function EventBanner() {
    const [events, setEvents] = useState<CalEvent[]>([])
    const [activeIndex, setActiveIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0]
        supabase
            .from('event_cal')
            .select('id, event_name, event_date, venue')
            .gte('event_date', today)
            .order('event_date', { ascending: true })
            .limit(10)
            .then(({ data }) => {
                setEvents(data ?? [])
                setIsLoading(false)
            })
    }, [])

    useEffect(() => {
        if (events.length <= 1) return
        intervalRef.current = setInterval(() => {
            setActiveIndex(i => (i + 1) % events.length)
        }, 4000)
        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [events.length])

    if (isLoading) {
        return (
            <div className="h-52 glass-card animate-pulse border-dashed flex items-center justify-center">
                <p className="text-gray-600 text-xs font-black uppercase tracking-widest">Loading Events...</p>
            </div>
        )
    }

    if (events.length === 0) {
        return (
            <div className="h-52 glass-card border-dashed flex flex-col items-center justify-center gap-3">
                <span className="text-4xl">🗓️</span>
                <p className="text-gray-600 text-xs font-black uppercase tracking-widest">No upcoming events</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">Upcoming Events</p>
                <span className="text-[9px] font-black text-gray-600 ml-1">{events.length} events</span>
            </div>

            {/* Banner card */}
            <div className="relative overflow-hidden" style={{ minHeight: '220px' }}>
                {events.map((event, i) => {
                    const grad = GRADIENTS[i % GRADIENTS.length]
                    const glow = GLOWS[i % GLOWS.length]
                    const emoji = EMOJIS[i % EMOJIS.length]
                    const { label: daysLabel, color: daysColor } = getDaysUntil(event.event_date)
                    const isActive = i === activeIndex

                    return (
                        <div
                            key={event.id}
                            className={`absolute inset-0 transition-all duration-700 ease-in-out rounded-[2rem] ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                        >
                            <Link href="/events" className={`block h-full min-h-[220px] bg-gradient-to-br ${grad} rounded-[2rem] p-8 relative overflow-hidden shadow-2xl ${glow} group`}>
                                {/* Decorative circles */}
                                <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/[0.03]" />
                                <div className="absolute -bottom-10 right-10 w-28 h-28 rounded-full bg-white/[0.03]" />
                                {/* Neon top line */}
                                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[2rem] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl flex-shrink-0">
                                            {emoji}
                                        </div>
                                        {daysLabel && (
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest border ${daysColor}`}>
                                                {daysLabel}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-2 mt-4">
                                        <h3 className="text-xl font-black text-white tracking-tight leading-tight group-hover:text-glow transition-all line-clamp-2">
                                            {event.event_name}
                                        </h3>
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <span className="text-xs text-white/50 font-bold flex items-center gap-1.5">
                                                <span>📅</span>
                                                {formatDate(event.event_date)}
                                            </span>
                                            {event.venue && (
                                                <span className="text-xs text-white/40 font-bold flex items-center gap-1.5">
                                                    <span>📍</span>
                                                    {event.venue}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    )
                })}

                {/* Spacer to keep height */}
                <div className="invisible min-h-[220px] pointer-events-none"></div>
            </div>

            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-2">
                {events.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-6 bg-blue-500' : 'w-1.5 bg-white/20'}`}
                    />
                ))}
            </div>
        </div>
    )
}
