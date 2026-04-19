'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'

interface CalEvent {
    id: string
    event_name: string
    event_date: string
    venue?: string
    description?: string
    department?: string
    year?: string
}

const CARD_PALETTES = [
    { bg: 'from-[#0d0020] via-[#2a0066] to-[#4b0099]', glow: 'rgba(120,40,255,0.45)', line: '#7B2FFF', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    { bg: 'from-[#001833] via-[#003d7a] to-[#005fcc]', glow: 'rgba(0,120,255,0.45)', line: '#0080FF', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    { bg: 'from-[#001a12] via-[#004d30] to-[#008550]', glow: 'rgba(0,180,100,0.45)', line: '#00C870', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    { bg: 'from-[#1a0800] via-[#6b2000] to-[#cc4000]', glow: 'rgba(255,100,0,0.45)', line: '#FF6600', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
    { bg: 'from-[#1a0010] via-[#660040] to-[#cc0066]', glow: 'rgba(255,0,120,0.45)', line: '#FF0088', badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40' },
    { bg: 'from-[#0a0a18] via-[#1a1a4a] to-[#2a2a7a]', glow: 'rgba(80,80,200,0.45)', line: '#5555DD', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
]

const EMOJIS = ['⚡', '🎯', '🚀', '🏆', '🎓', '🌟', '🔥', '💡', '🎪', '📡']
const TAGS = ['Workshop', 'Seminar', 'Cultural', 'Tech Talk', 'Hackathon', 'Competition', 'Exhibition', 'Webinar']

function getDaysInfo(dateStr: string) {
    try {
        const date = new Date(dateStr)
        const todayMs = new Date().setHours(0, 0, 0, 0)
        const diff = Math.ceil((date.setHours(12, 0, 0, 0) - todayMs) / 86400000)
        if (diff === 0) return { label: 'TODAY', urgency: 'red' as const }
        if (diff === 1) return { label: 'TOMORROW', urgency: 'orange' as const }
        if (diff < 0) return { label: 'PAST', urgency: 'gray' as const }
        if (diff <= 3) return { label: `${diff} DAYS`, urgency: 'amber' as const }
        if (diff <= 7) return { label: `${diff} DAYS`, urgency: 'yellow' as const }
        return { label: `${diff} DAYS`, urgency: 'green' as const }
    } catch {
        return { label: '', urgency: 'gray' as const }
    }
}

const URGENCY_STYLES = {
    red: 'bg-red-500/20 text-red-300 border-red-500/50 shadow-red-500/20',
    orange: 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-orange-500/20',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/20',
    yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-yellow-500/20',
    green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20',
    gray: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
}

function formatDate(dateStr: string) {
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            weekday: 'short', day: 'numeric', month: 'long',
        })
    } catch { return dateStr }
}

interface Props {
    canAddEvent?: boolean
    userDept?: string
    userYear?: string
}

export function EventBanner({ canAddEvent = false, userDept, userYear }: Props) {
    const [events, setEvents] = useState<CalEvent[]>([])
    const [activeIndex, setActiveIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [newName, setNewName] = useState('')
    const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0])
    const [newVenue, setNewVenue] = useState('')
    const [newDesc, setNewDesc] = useState('')
    const [newDept, setNewDept] = useState('General')
    const [newYear, setNewYear] = useState('General')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [addError, setAddError] = useState('')
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const supabase = createClient()

    const fetchEvents = useCallback(async () => {
        const today = new Date().toISOString().split('T')[0]

        // Build compound OR filters for dept and year
        const deptFilter = userDept && userDept !== 'Other'
            ? `department.eq.General,department.eq.${userDept}`
            : 'department.eq.General'
        const yearFilter = userYear && userYear !== 'General'
            ? `year.eq.General,year.eq.${userYear}`
            : 'year.eq.General'

        const { data } = await supabase
            .from('event_cal')
            .select('id, event_name, event_date, venue, description, department, year')
            .gte('event_date', today)
            .or(deptFilter)
            .or(yearFilter)
            .order('event_date', { ascending: true })
            .limit(12)
        setEvents(data ?? [])
        setIsLoading(false)
    }, [supabase, userDept, userYear])

    useEffect(() => { fetchEvents() }, [fetchEvents])

    useEffect(() => {
        if (events.length <= 1) return
        intervalRef.current = setInterval(() => {
            setActiveIndex(i => (i + 1) % events.length)
        }, 4500)
        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [events.length])

    // Real-time listener for event_cal table
    useEffect(() => {
        const channel = supabase.channel('event-banner-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event_cal' }, () => {
                fetchEvents()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, fetchEvents])

    const handleAddEvent = async () => {
        if (!newName.trim() || !newDate) { setAddError('Event name and date are required.'); return }
        setAddError('')
        setIsSubmitting(true)
        try {
            const eventDate = new Date(newDate)
            eventDate.setHours(12, 0, 0, 0)
            const { error } = await supabase.from('event_cal').insert({
                event_name: newName.trim(),
                event_date: eventDate.toISOString(),
                venue: newVenue.trim() || 'TBA',
                description: newDesc.trim() || null,
                department: newDept,
                year: newYear
            })
            if (error) throw error
            setNewName(''); setNewDate(new Date().toISOString().split('T')[0])
            setNewVenue(''); setNewDesc(''); setNewDept('General'); setNewYear('General')
            setShowAddModal(false)
            fetchEvents()
        } catch (e: any) {
            setAddError(e.message || 'Failed to add event.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteEvent = async (id: string) => {
        setDeletingId(id)
        await supabase.from('event_cal').delete().eq('id', id)
        setDeletingId(null)
        // If deleted event was active, move to previous
        setActiveIndex(prev => Math.max(0, prev >= events.length - 1 ? events.length - 2 : prev))
        fetchEvents()
    }

    if (isLoading) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-3 h-3 rounded-full bg-blue-500/30 animate-pulse" />
                    <span className="h-3 w-28 bg-white/5 rounded animate-pulse" />
                </div>
                <div className="h-56 rounded-[2rem] bg-white/5 animate-pulse" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                    </span>
                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">Upcoming Events</p>
                    <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        {events.length}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {canAddEvent && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105"
                        >
                            <span className="text-sm">+</span> Add Event
                        </button>
                    )}
                    <Link href="/events" className="text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
                        View All →
                    </Link>
                </div>
            </div>

            {events.length === 0 ? (
                <div className="h-52 rounded-[2rem] border border-dashed border-white/10 flex flex-col items-center justify-center gap-3">
                    <span className="text-4xl">🗓️</span>
                    <p className="text-gray-600 text-xs font-black uppercase tracking-widest">No upcoming events</p>
                    {canAddEvent && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white transition-all"
                        >
                            + Schedule First Event
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* Card carousel */}
                    <div className="relative overflow-hidden" style={{ minHeight: '240px' }}>
                        {events.map((event, i) => {
                            const palette = CARD_PALETTES[i % CARD_PALETTES.length]
                            const emoji = EMOJIS[i % EMOJIS.length]
                            const tag = TAGS[i % TAGS.length]
                            const { label: daysLabel, urgency } = getDaysInfo(event.event_date)
                            const isActive = i === activeIndex

                            return (
                                <div
                                    key={event.id}
                                    className={`absolute inset-0 transition-all duration-700 ease-in-out rounded-[2rem] ${isActive ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-4 scale-[0.97] pointer-events-none'}`}
                                >
                                    <div
                                        className={`relative h-full min-h-[240px] bg-gradient-to-br ${palette.bg} rounded-[2rem] overflow-hidden group cursor-pointer`}
                                        style={{ boxShadow: `0 20px 60px ${palette.glow}` }}
                                        onClick={() => window.location.href = '/events'}
                                    >
                                        {/* Ambient blob */}
                                        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full" style={{ background: `radial-gradient(circle, ${palette.glow} 0%, transparent 70%)`, filter: 'blur(30px)' }} />
                                        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full" style={{ background: `radial-gradient(circle, ${palette.glow} 0%, transparent 70%)`, filter: 'blur(20px)', opacity: 0.5 }} />

                                        {/* Neon accent line */}
                                        <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg, transparent, ${palette.line}, transparent)` }} />

                                        {/* Mesh grid overlay */}
                                        <div className="absolute inset-0 opacity-[0.04]" style={{
                                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                                            backgroundSize: '32px 32px',
                                        }} />

                                        {/* Corner bracket decorations */}
                                        <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 border-white/20 rounded-tl-lg" />
                                        <div className="absolute top-5 right-5 w-6 h-6 border-t-2 border-r-2 border-white/20 rounded-tr-lg" />

                                        {/* Delete button on card (exec only) */}
                                        {canAddEvent && (
                                            <button
                                                onClick={e => { e.stopPropagation(); handleDeleteEvent(event.id) }}
                                                disabled={deletingId === event.id}
                                                className="absolute bottom-5 right-5 z-20 w-8 h-8 rounded-xl bg-black/40 hover:bg-red-500/40 border border-white/10 hover:border-red-500/50 flex items-center justify-center text-white/40 hover:text-red-300 transition-all disabled:opacity-40"
                                                title="Delete event"
                                            >
                                                {deletingId === event.id
                                                    ? <span className="text-[10px]">⏳</span>
                                                    : <Trash2 size={12} />
                                                }
                                            </button>
                                        )}

                                        {/* Content */}
                                        <div className="relative z-10 p-8 h-full flex flex-col justify-between">
                                            {/* Top row */}
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                                                        {emoji}
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border text-white/40 border-white/10 bg-white/5">
                                                            {tag}
                                                        </span>
                                                        {/* Year / Dept badges */}
                                                        <div className="flex gap-1 flex-wrap">
                                                            {event.year && event.year !== 'General' && (
                                                                <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40">
                                                                    {event.year} Year
                                                                </span>
                                                            )}
                                                            {event.department && event.department !== 'General' && (
                                                                <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full bg-blue-500/25 text-blue-300 border border-blue-500/40">
                                                                    {event.department}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {daysLabel && (
                                                    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest border shadow-lg ${URGENCY_STYLES[urgency]}`}>
                                                        📅 {daysLabel}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Bottom info */}
                                            <div className="space-y-3 mt-4">
                                                <h3 className="text-xl font-black text-white tracking-tight leading-tight line-clamp-2 group-hover:text-glow transition-all" style={{ textShadow: `0 0 30px ${palette.glow}` }}>
                                                    {event.event_name}
                                                </h3>
                                                {event.description && (
                                                    <p className="text-xs text-white/40 font-medium line-clamp-1">{event.description}</p>
                                                )}
                                                <div className="flex items-center gap-4 flex-wrap">
                                                    <span className="text-xs text-white/50 font-bold flex items-center gap-1.5">
                                                        <span className="text-base">📅</span>
                                                        {formatDate(event.event_date)}
                                                    </span>
                                                    {event.venue && (
                                                        <span className="text-xs text-white/35 font-bold flex items-center gap-1.5">
                                                            <span className="text-base">📍</span>
                                                            {event.venue}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Progress line */}
                                                <div className="h-[1px] bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${((i + 1) / events.length) * 100}%`, background: `linear-gradient(90deg, ${palette.line}66, ${palette.line})` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        {/* Height spacer */}
                        <div className="invisible min-h-[240px] pointer-events-none" />
                    </div>

                    {/* Dot indicators + navigation */}
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            {events.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveIndex(i)}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-6 bg-blue-500' : 'w-1.5 bg-white/15 hover:bg-white/30'}`}
                                    aria-label={`Go to event ${i + 1}`}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveIndex(i => (i - 1 + events.length) % events.length)}
                                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all text-xs"
                            >‹</button>
                            <button
                                onClick={() => setActiveIndex(i => (i + 1) % events.length)}
                                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all text-xs"
                            >›</button>
                        </div>
                    </div>

                    {/* Scrollable event list below cards */}
                    <div className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {events.map((event, i) => {
                            const { label: daysLabel, urgency } = getDaysInfo(event.event_date)
                            const isActive = i === activeIndex
                            return (
                                <div
                                    key={event.id}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all group ${isActive ? 'bg-white/8 border border-white/10' : 'hover:bg-white/4 border border-transparent'}`}
                                >
                                    <button
                                        onClick={() => setActiveIndex(i)}
                                        className="flex items-center gap-3 flex-1 min-w-0"
                                    >
                                        <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: CARD_PALETTES[i % CARD_PALETTES.length].line }} />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-black truncate transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                                {event.event_name}
                                            </p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-[10px] text-gray-600 font-medium">{formatDate(event.event_date)}</p>
                                                {event.year && event.year !== 'General' && (
                                                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                                        {event.year} Yr
                                                    </span>
                                                )}
                                                {event.department && event.department !== 'General' && (
                                                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                                        {event.department}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {daysLabel && (
                                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full border ${URGENCY_STYLES[urgency]}`}>
                                                {daysLabel}
                                            </span>
                                        )}
                                        {canAddEvent && (
                                            <button
                                                onClick={() => handleDeleteEvent(event.id)}
                                                disabled={deletingId === event.id}
                                                className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 transition-all disabled:opacity-40"
                                                title="Delete event"
                                            >
                                                {deletingId === event.id
                                                    ? <span className="text-[8px]">⏳</span>
                                                    : <Trash2 size={10} />
                                                }
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            {/* Add Event Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                    <div
                        className="relative z-10 w-full max-w-md glass rounded-3xl p-8 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="mb-6">
                            <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase mb-1">Schedule</p>
                            <h2 className="text-2xl font-black text-white">Add Event</h2>
                        </div>

                        {addError && (
                            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                                {addError}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Event Name */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase block">Event Name *</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="e.g. Hackathon 2025"
                                    autoFocus
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                            {/* Date */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase block">Date *</label>
                                <input
                                    type="date"
                                    value={newDate}
                                    onChange={e => setNewDate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all [color-scheme:dark]"
                                />
                            </div>
                            {/* Venue */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase block">Venue</label>
                                <input
                                    type="text"
                                    value={newVenue}
                                    onChange={e => setNewVenue(e.target.value)}
                                    placeholder="e.g. Main Auditorium (leave blank for TBA)"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                            {/* Target Department */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase block">Target Department</label>
                                <select
                                    value={newDept}
                                    onChange={e => setNewDept(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all [color-scheme:dark]"
                                >
                                    <option value="General" className="bg-[#0a0a15] text-white">General (All Departments)</option>
                                    <option value="CSE" className="bg-[#0a0a15] text-white">CSE</option>
                                    <option value="ECE" className="bg-[#0a0a15] text-white">ECE</option>
                                    <option value="BT" className="bg-[#0a0a15] text-white">BT</option>
                                    <option value="ME" className="bg-[#0a0a15] text-white">ME</option>
                                    <option value="MEA" className="bg-[#0a0a15] text-white">MEA</option>
                                </select>
                            </div>
                            {/* Target Year */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black tracking-widest text-amber-500/60 uppercase block">Target Year</label>
                                <select
                                    value={newYear}
                                    onChange={e => setNewYear(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all [color-scheme:dark]"
                                >
                                    <option value="General" className="bg-[#0a0a15] text-white">General (All Years)</option>
                                    <option value="1st" className="bg-[#0a0a15] text-white">1st Year</option>
                                    <option value="2nd" className="bg-[#0a0a15] text-white">2nd Year</option>
                                    <option value="3rd" className="bg-[#0a0a15] text-white">3rd Year</option>
                                    <option value="4th" className="bg-[#0a0a15] text-white">4th Year</option>
                                </select>
                                <p className="text-[9px] text-gray-600 font-medium ml-1">
                                    {newDept === 'General' && newYear !== 'General'
                                        ? `⚡ All ${newYear} year students will see this regardless of dept`
                                        : newYear === 'General' && newDept !== 'General'
                                        ? `⚡ All ${newDept} students will see this regardless of year`
                                        : newYear === 'General' && newDept === 'General'
                                        ? '⚡ Visible to everyone'
                                        : `⚡ Visible to ${newYear} year ${newDept} students only`
                                    }
                                </p>
                            </div>
                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase block">Description</label>
                                <textarea
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    placeholder="Brief description (optional)"
                                    rows={2}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-gray-500 hover:text-white border border-white/10 hover:border-white/20 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddEvent}
                                disabled={isSubmitting || !newName.trim()}
                                className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-all shadow-lg shadow-blue-500/20"
                            >
                                {isSubmitting ? 'Saving...' : '📅 Publish Event'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
