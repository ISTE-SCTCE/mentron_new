'use client'

import { useState, useEffect } from 'react'
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
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { createClient } from '@/app/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

interface Event {
    id: string
    event_name: string
    event_date: string
    venue?: string
}

interface CalendarProps {
    isExec: boolean
}

export function DashboardCalendar({ isExec }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [events, setEvents] = useState<Event[]>([])
    const [isAddingMode, setIsAddingMode] = useState(false)
    const [newEventName, setNewEventName] = useState('')
    const [newEventVenue, setNewEventVenue] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchEvents()
    }, [])

    const fetchEvents = async () => {
        const { data } = await supabase
            .from('event_cal')
            .select('id, event_name, event_date, venue')
        if (data) setEvents(data)
    }

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
    const onDateClick = (day: Date) => {
        setSelectedDate(day)
        setIsAddingMode(false)
    }

    const handleAddEvent = async () => {
        if (!newEventName.trim()) return
        setIsSubmitting(true)

        // Set the event time to noon on the selected date to avoid timezone stripping
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
            venue: newEventVenue || 'TBA'
        })

        if (!error) {
            setNewEventName('')
            setNewEventVenue('')
            setIsAddingMode(false)
            fetchEvents()
        }
        setIsSubmitting(false)
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
    let formattedDate = ""

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            formattedDate = format(day, dateFormat)
            const cloneDay = day

            // Check if day has events
            const dayEvents = events.filter(e => isSameDay(parseISO(e.event_date), cloneDay))
            const hasEvents = dayEvents.length > 0
            const isSelected = isSameDay(day, selectedDate)

            days.push(
                <div
                    key={day.toISOString()}
                    onClick={() => onDateClick(cloneDay)}
                    className={`
                        relative flex justify-center items-center w-8 h-8 md:w-10 md:h-10 text-xs md:text-sm cursor-pointer rounded-full transition-all duration-300
                        ${!isSameMonth(day, monthStart)
                            ? 'text-gray-700 font-medium'
                            : 'text-gray-300 font-bold hover:bg-white/5'}
                        ${isSelected ? 'bg-cyan-500 text-white font-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : ''}
                        ${hasEvents && !isSelected ? 'bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : ''}
                    `}
                >
                    <span className="relative z-10">{formattedDate}</span>
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

    // Selected Date Events
    const selectedDateEvents = events.filter(e => isSameDay(parseISO(e.event_date), selectedDate))

    return (
        <div className="glass p-8 rounded-[2.5rem] flex flex-col items-center border border-white/5 bg-[#030305]/90 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-8 px-2">
                <h2 className="text-xl font-black text-white tracking-tight">Calendar</h2>
                <div className="flex items-center gap-4">
                    <button onClick={prevMonth} className="text-gray-500 hover:text-cyan-400 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-bold text-gray-300 min-w-[100px] text-center">
                        {format(currentDate, "MMMM yyyy")}
                    </span>
                    <button onClick={nextMonth} className="text-gray-500 hover:text-cyan-400 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Days of Week Header */}
            <div className="flex justify-between w-full mb-4 px-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, idx) => (
                    <div key={idx} className="w-8 md:w-10 flex justify-center">
                        <span className="text-[10px] font-black text-blue-500 uppercase">{dayName}</span>
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="w-full px-2">
                {rows}
            </div>

            {/* Events List */}
            <div className="w-full mt-8 pt-6 border-t border-white/5 flex flex-col gap-4">
                <h3 className="text-sm font-black text-white">Upcoming Events</h3>

                {selectedDateEvents.length > 0 ? (
                    <div className="space-y-3">
                        {selectedDateEvents.map((evt) => (
                            <div key={evt.id} className="flex flex-col gap-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-xs font-bold text-cyan-400">{evt.event_name}</span>
                                {evt.venue && <span className="text-[10px] text-gray-400 uppercase tracking-widest">📍 {evt.venue}</span>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-blue-500/50 font-medium">No events for {format(selectedDate, 'MMM d')}</p>
                )}

                {/* Execom Add Event Flow */}
                {isExec && (
                    <div className="mt-4">
                        {!isAddingMode ? (
                            <button
                                onClick={() => setIsAddingMode(true)}
                                className="w-full py-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] flex flex-row items-center justify-center gap-2"
                            >
                                <Plus size={16} strokeWidth={3} />
                                Add Event
                            </button>
                        ) : (
                            <div className="space-y-3 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-2 flex items-center justify-between">
                                    Adding for {format(selectedDate, 'MMM d')}
                                    <button onClick={() => setIsAddingMode(false)} className="text-gray-400 hover:text-white">✕</button>
                                </p>
                                <input
                                    type="text"
                                    placeholder="Event Name"
                                    value={newEventName}
                                    onChange={e => setNewEventName(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                                />
                                <input
                                    type="text"
                                    placeholder="Venue (Optional)"
                                    value={newEventVenue}
                                    onChange={e => setNewEventVenue(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                                />
                                <button
                                    onClick={handleAddEvent}
                                    disabled={!newEventName.trim() || isSubmitting}
                                    className="w-full py-3 rounded-xl bg-cyan-500 disabled:opacity-50 text-black text-[10px] font-black uppercase tracking-widest mt-2 hover:bg-cyan-400 transition-colors"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Event'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
