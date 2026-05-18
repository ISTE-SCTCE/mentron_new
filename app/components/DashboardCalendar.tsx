'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    parseISO,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Trash2, X, MapPin, CalendarDays } from 'lucide-react'
import { createClient } from '@/app/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

interface Event {
    id: string
    event_name: string
    event_date: string
    venue?: string
    department?: string
    year?: string
    registration_required?: boolean
}

interface CalendarProps {
    isExec: boolean
    userDept?: string
    userYear?: string
}

export function DashboardCalendar({ isExec, userDept, userYear }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [events, setEvents] = useState<Event[]>([])
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
    const [hoveredEvents, setHoveredEvents] = useState<Event[]>([])
    const [isAddingMode, setIsAddingMode] = useState(false)
    const [newEventName, setNewEventName] = useState('')
    const [newEventVenue, setNewEventVenue] = useState('')
    const [newEventDept, setNewEventDept] = useState('General')
    const [newEventYear, setNewEventYear] = useState('General')
    const [registrationRequired, setRegistrationRequired] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const supabase = createClient()

    const fetchEvents = useCallback(async () => {
        const deptFilter = userDept && userDept !== 'Other'
            ? `department.eq.General,department.eq.${userDept}`
            : 'department.eq.General'
        const yearFilter = userYear && userYear !== 'General'
            ? `year.eq.General,year.eq.${userYear}`
            : 'year.eq.General'

        const { data } = await supabase
            .from('event_cal')
            .select('id, event_name, event_date, venue, department, year, registration_required')
            .or(deptFilter)
            .or(yearFilter)
        if (data) setEvents(data)
    }, [supabase, userDept, userYear])

    useEffect(() => {
        fetchEvents()
    }, [fetchEvents])

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

    const handleAddEvent = async () => {
        if (!newEventName.trim()) return
        setIsSubmitting(true)

        const eventDateString = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            12, 0, 0
        ).toISOString()

        const { error } = await supabase.from('event_cal').insert({
            id: uuidv4(),
            event_name: newEventName,
            event_date: eventDateString,
            venue: newEventVenue || 'TBA',
            department: newEventDept,
            year: newEventYear,
            registration_required: registrationRequired
        })

        if (!error) {
            setNewEventName('')
            setNewEventVenue('')
            setNewEventDept('General')
            setNewEventYear('General')
            setRegistrationRequired(false)
            setIsAddingMode(false)
            fetchEvents()
        }
        setIsSubmitting(false)
    }

    const handleDeleteEvent = async (id: string) => {
        setDeletingId(id)
        await supabase.from('event_cal').delete().eq('id', id)
        setDeletingId(null)
        fetchEvents()
    }

    // -- Calendar Grid Builder --
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const dateFormat = "d"
    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            const formattedDate = format(day, dateFormat)
            const cloneDay = new Date(day)

            const dayEvents = events.filter(e => isSameDay(parseISO(e.event_date), cloneDay))
            const hasEvents = dayEvents.length > 0
            const isSelected = isSameDay(day, selectedDate)
            const isHovered = hoveredDate ? isSameDay(day, hoveredDate) : false
            const isInCurrentMonth = isSameMonth(day, monthStart)

            days.push(
                <div
                    key={day.toISOString()}
                    onClick={() => {
                        setSelectedDate(cloneDay)
                        if (hasEvents) {
                            setIsAddingMode(false)
                        }
                    }}
                    onMouseEnter={() => {
                        if (hasEvents) {
                            setHoveredDate(cloneDay)
                            setHoveredEvents(dayEvents)
                        }
                    }}
                    onMouseLeave={() => {
                        setHoveredDate(null)
                        setHoveredEvents([])
                    }}
                    className={`
                        relative flex justify-center items-center w-8 h-8 md:w-10 md:h-10 text-xs md:text-sm cursor-pointer rounded-full transition-all duration-300
                        ${!isInCurrentMonth
                            ? 'text-gray-700 font-medium'
                            : 'text-gray-300 font-bold hover:bg-white/5'}
                        ${isSelected ? 'bg-cyan-500 text-white font-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : ''}
                        ${hasEvents && !isSelected ? 'bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : ''}
                        ${hoveredDate && !isHovered && hasEvents ? 'opacity-30 blur-[1px]' : ''}
                        ${hoveredDate && !isHovered && !hasEvents && isInCurrentMonth ? 'opacity-40' : ''}
                    `}
                    style={{ position: 'relative' }}
                >
                    <span className="relative z-10">{formattedDate}</span>

                    {/* Hover popup for dates with events */}
                    {isHovered && hasEvents && (
                        <div
                            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 animate-in slide-in-from-bottom-2 fade-in duration-200"
                            style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))' }}
                        >
                            {/* Arrow */}
                            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#1a1a2e] border-r border-b border-purple-500/30" />
                            <div className="rounded-2xl bg-[#0d0d1a] border border-purple-500/30 p-3 space-y-2 shadow-2xl shadow-purple-900/30">
                                <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <CalendarDays size={9} /> {format(cloneDay, 'MMM d')}
                                </p>
                                {dayEvents.slice(0, 3).map(evt => (
                                    <div key={evt.id} className="space-y-0.5">
                                        <p className="text-[10px] font-bold text-white leading-tight">{evt.event_name}</p>
                                        {evt.venue && evt.venue !== 'TBA' && (
                                            <p className="text-[8px] text-gray-500 flex items-center gap-1">
                                                <MapPin size={7} /> {evt.venue}
                                            </p>
                                        )}
                                    </div>
                                ))}
                                {dayEvents.length > 3 && (
                                    <p className="text-[8px] text-purple-400 font-bold">+{dayEvents.length - 3} more</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )
            day = addDays(day, 1)
        }
        rows.push(
            <div className="flex justify-between w-full mb-2" key={day.toISOString()}>
                {days}
            </div>
        )
        days = []
    }

    const selectedDateEvents = events.filter(e => isSameDay(parseISO(e.event_date), selectedDate))

    return (
        <div className="glass p-6 md:p-8 rounded-[2.5rem] flex flex-col items-center border border-white/5 bg-[#030305]/90 backdrop-blur-3xl shadow-2xl relative overflow-visible group h-full">
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6 px-2">
                <h2 className="text-xl font-black text-white tracking-tight">Calendar</h2>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <button onClick={prevMonth} className="text-gray-500 hover:text-cyan-400 transition-colors p-1">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm font-bold text-gray-300 min-w-[100px] text-center">
                            {format(currentDate, "MMMM yyyy")}
                        </span>
                        <button onClick={nextMonth} className="text-gray-500 hover:text-cyan-400 transition-colors p-1">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    {/* Add Event button in header for exec */}
                    {isExec && !isAddingMode && (
                        <button
                            onClick={() => setIsAddingMode(true)}
                            className="w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:scale-110"
                            title="Add Event"
                        >
                            <Plus size={14} strokeWidth={3} />
                        </button>
                    )}
                    {isExec && isAddingMode && (
                        <button
                            onClick={() => setIsAddingMode(false)}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Days of Week Header */}
            <div className="flex justify-between w-full mb-3 px-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, idx) => (
                    <div key={idx} className="w-8 md:w-10 flex justify-center">
                        <span className="text-[10px] font-black text-blue-500 uppercase">{dayName}</span>
                    </div>
                ))}
            </div>

            {/* Grid — overflow-visible so popups show above */}
            <div className="w-full px-2 overflow-visible">
                {rows}
            </div>

            {/* Selected date events (when clicked) */}
            {selectedDateEvents.length > 0 && !isAddingMode && (
                <div className="w-full mt-5 pt-5 border-t border-white/5 space-y-2">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">
                        {format(selectedDate, 'MMM d')} Events
                    </p>
                    {selectedDateEvents.map((evt) => (
                        <div key={evt.id} className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-bold text-cyan-400 block">{evt.event_name}</span>
                                {evt.venue && <span className="text-[9px] text-gray-400 uppercase tracking-widest">📍 {evt.venue}</span>}
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {evt.year && evt.year !== 'General' && (
                                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                            {evt.year} Year
                                        </span>
                                    )}
                                    {evt.department && evt.department !== 'General' && (
                                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                            {evt.department}
                                        </span>
                                    )}
                                    {evt.registration_required && (
                                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30">
                                            Reg Req
                                        </span>
                                    )}
                                </div>
                            </div>
                            {isExec && (
                                <button
                                    onClick={() => handleDeleteEvent(evt.id)}
                                    disabled={deletingId === evt.id}
                                    className="shrink-0 w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 transition-all disabled:opacity-40"
                                >
                                    {deletingId === evt.id
                                        ? <span className="text-[8px] animate-spin">⏳</span>
                                        : <Trash2 size={10} />
                                    }
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Event form */}
            {isExec && isAddingMode && (
                <div className="w-full mt-5 pt-5 border-t border-white/5">
                    <div className="space-y-3 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                        <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest">
                            Adding event for {format(selectedDate, 'MMM d')}
                        </p>
                        <input
                            type="text"
                            placeholder="Event Name"
                            value={newEventName}
                            onChange={e => setNewEventName(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                        />
                        <input
                            type="text"
                            placeholder="Venue (Optional)"
                            value={newEventVenue}
                            onChange={e => setNewEventVenue(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black tracking-widest text-cyan-400/50 uppercase">Dept</label>
                                <select
                                    value={newEventDept}
                                    onChange={e => setNewEventDept(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-2 py-2 text-[10px] text-white focus:outline-none [color-scheme:dark]"
                                >
                                    <option value="General" className="bg-[#0a0a0a] text-white">All Depts</option>
                                    <option value="CSE" className="bg-[#0a0a0a] text-white">CSE</option>
                                    <option value="ECE" className="bg-[#0a0a0a] text-white">ECE</option>
                                    <option value="BT" className="bg-[#0a0a0a] text-white">BT</option>
                                    <option value="ME" className="bg-[#0a0a0a] text-white">ME</option>
                                    <option value="MEA" className="bg-[#0a0a0a] text-white">MEA</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black tracking-widest text-amber-400/50 uppercase">Year</label>
                                <select
                                    value={newEventYear}
                                    onChange={e => setNewEventYear(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-2 py-2 text-[10px] text-white focus:outline-none [color-scheme:dark]"
                                >
                                    <option value="General" className="bg-[#0a0a0a] text-white">All Years</option>
                                    <option value="1st" className="bg-[#0a0a0a] text-white">1st Year</option>
                                    <option value="2nd" className="bg-[#0a0a0a] text-white">2nd Year</option>
                                    <option value="3rd" className="bg-[#0a0a0a] text-white">3rd Year</option>
                                    <option value="4th" className="bg-[#0a0a0a] text-white">4th Year</option>
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={handleAddEvent}
                            disabled={!newEventName.trim() || isSubmitting}
                            className="w-full py-2.5 rounded-xl bg-cyan-500 disabled:opacity-50 text-black text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-colors"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Event'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
