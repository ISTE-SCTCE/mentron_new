'use client'

import { useMemo } from 'react'
import Link from 'next/link'

interface Contribution {
    id: string
    created_at: string
    status: string
    projects: {
        id: string
        title: string
        description: string
        category?: string
        role?: string
        duration?: string
        created_at: string
        profiles: {
            full_name: string | null
        } | null
    } | null
}

interface Props {
    contributions: Contribution[]
}

export function ContributionsView({ contributions }: Props) {
    // 1. Build a map of YYYY-MM-DD date strings to contribution counts
    const dateMap = useMemo(() => {
        const map: Record<string, number> = {}
        contributions.forEach(c => {
            if (c.created_at) {
                const dateStr = new Date(c.created_at).toISOString().split('T')[0]
                map[dateStr] = (map[dateStr] || 0) + 1
            }
        })
        return map
    }, [contributions])

    // 2. Generate a grid representing the last 53 weeks (starts on Sunday)
    const calendarGrid = useMemo(() => {
        const weeks = []
        const today = new Date()
        
        // Find the date of 371 days ago (53 weeks * 7 days)
        const startDate = new Date()
        startDate.setDate(today.getDate() - 371)
        
        // Move startDate back to the nearest Sunday to align the calendar grid columns
        const startDayOfWeek = startDate.getDay()
        startDate.setDate(startDate.getDate() - startDayOfWeek)

        const currentDate = new Date(startDate)
        
        // Loop over 53 weeks
        for (let w = 0; w < 53; w++) {
            const weekDays = []
            // Loop over 7 days of the week
            for (let d = 0; d < 7; d++) {
                const dateClone = new Date(currentDate)
                const dateStr = dateClone.toISOString().split('T')[0]
                const count = dateMap[dateStr] || 0
                
                weekDays.push({
                    date: dateClone,
                    dateStr,
                    count
                })
                
                currentDate.setDate(currentDate.getDate() + 1)
            }
            weeks.push(weekDays)
        }
        return weeks
    }, [dateMap])

    // Determine cell colors based on contribution count
    const getIntensityClass = (count: number) => {
        if (count === 0) return 'bg-white/5 border border-white/[0.02]'
        if (count === 1) return 'bg-emerald-500/25 border border-emerald-500/10'
        if (count === 2) return 'bg-emerald-500/50 border border-emerald-500/20'
        if (count === 3) return 'bg-emerald-500/75 border border-emerald-500/30'
        return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
    }

    // Month label calculations
    const monthLabels = useMemo(() => {
        const labels: { text: string; colSpan: number }[] = []
        let currentMonth = -1
        let weekCount = 0

        calendarGrid.forEach((week) => {
            const firstDayOfWeek = week[0].date
            const month = firstDayOfWeek.getMonth()
            
            if (month !== currentMonth) {
                if (weekCount > 0) {
                    labels[labels.length - 1].colSpan = weekCount
                }
                labels.push({
                    text: firstDayOfWeek.toLocaleString('en-US', { month: 'short' }),
                    colSpan: 1
                })
                currentMonth = month
                weekCount = 1
            } else {
                weekCount++
            }
        })
        
        if (labels.length > 0) {
            labels[labels.length - 1].colSpan = weekCount
        }
        
        return labels
    }, [calendarGrid])

    return (
        <div className="space-y-12">
            {/* Calendar Card */}
            <div className="glass-card p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none select-none">
                    <span className="text-[12rem] font-black">📅</span>
                </div>

                <div className="relative z-10 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-white">Contribution History</h2>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                            Your accepted project applications over the last year.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                        <span>Total Accepted:</span>
                        <span className="text-emerald-400 text-xs">{contributions.length}</span>
                    </div>
                </div>

                {/* Git Heatmap Wrapper */}
                <div className="relative z-10 border border-white/5 rounded-2xl bg-black/20 p-6 overflow-x-auto custom-scrollbar">
                    <div className="min-w-[760px] flex flex-col select-none">
                        {/* Month labels */}
                        <div className="flex text-[9px] font-black text-gray-600 uppercase tracking-wider mb-2 ml-8">
                            {monthLabels.map((label, index) => {
                                const width = label.colSpan * 14;
                                return (
                                    <div key={index} style={{ width: `${width}px` }} className="text-left shrink-0">
                                        {label.text}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Calendar rows */}
                        <div className="flex gap-[3px]">
                            {/* Days labels */}
                            <div className="flex flex-col justify-between text-[8px] font-black text-gray-600 uppercase w-8 h-[96px] py-1 shrink-0">
                                <span>Sun</span>
                                <span>Tue</span>
                                <span>Thu</span>
                                <span>Sat</span>
                            </div>

                            {/* Contribution Squares columns */}
                            <div className="flex gap-[3px] flex-1">
                                {calendarGrid.map((week, wIndex) => (
                                    <div key={wIndex} className="flex flex-col gap-[3px] shrink-0">
                                        {week.map((day, dIndex) => (
                                            <div
                                                key={dIndex}
                                                className={`w-[11px] h-[11px] rounded-[2px] transition-all hover:scale-125 hover:z-20 cursor-pointer group relative ${getIntensityClass(day.count)}`}
                                            >
                                                {/* Tooltip */}
                                                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 bg-[#0d0d0d] border border-white/10 text-white rounded-lg px-3 py-1.5 text-[10px] font-bold shadow-2xl whitespace-nowrap">
                                                    <span className="text-emerald-400">{day.count} {day.count === 1 ? 'contribution' : 'contributions'}</span> on {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex justify-end items-center gap-1.5 text-[9px] font-black text-gray-600 uppercase tracking-widest mt-4">
                            <span>Less</span>
                            <div className="w-[10px] h-[10px] rounded-[2px] bg-white/5 border border-white/[0.02]" />
                            <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500/25 border border-emerald-500/10" />
                            <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500/50 border border-emerald-500/20" />
                            <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500/75 border border-emerald-500/30" />
                            <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500" />
                            <span>More</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* List of Contributions */}
            <div>
                <div className="mb-6">
                    <p className="text-[10px] font-black tracking-[0.3em] text-emerald-400 uppercase mb-1">Your Milestones</p>
                    <h2 className="text-2xl font-black text-white">Contributed Projects</h2>
                    <p className="text-gray-500 text-xs font-medium mt-1">
                        Projects where your application was accepted by the project lead.
                    </p>
                </div>

                {contributions.length === 0 ? (
                    <div className="glass-card border border-dashed border-white/10 py-20 text-center">
                        <p className="text-4xl mb-3 grayscale">🌱</p>
                        <p className="text-gray-500 font-black text-sm uppercase tracking-widest">No contributions yet</p>
                        <p className="text-gray-600 text-xs font-medium mt-2 max-w-sm mx-auto">
                            Apply to project listings! Once the owner accepts your application, it will show up here.
                        </p>
                        <Link
                            href="/projects"
                            className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                        >
                            Explore Projects
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {contributions.map((contribution) => {
                            const project = contribution.projects
                            if (!project) return null

                            return (
                                <div key={contribution.id} className="glass-card p-6 flex flex-col hover:border-emerald-500/30 transition-all duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-gray-600 uppercase">
                                                Accepted on {new Date(contribution.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                            {project.category && (
                                                <span className="self-start text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                                                    {project.category}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                            ✓ Contributor
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-black text-white mb-2 leading-tight">
                                        {project.title}
                                    </h3>
                                    <p className="text-gray-400 text-xs font-medium leading-relaxed mb-6 line-clamp-3 flex-1">
                                        {project.description}
                                    </p>

                                    {/* Role & Duration info grid */}
                                    {(project.role || project.duration) && (
                                        <div className="flex items-center gap-4 mb-5 text-[10px] font-bold text-gray-500 border-t border-white/5 pt-4">
                                            {project.role && (
                                                <div className="flex items-center gap-1.5">
                                                    <span>💼</span>
                                                    <span className="uppercase tracking-wider line-clamp-1">{project.role}</span>
                                                </div>
                                            )}
                                            {project.duration && (
                                                <div className="flex items-center gap-1.5">
                                                    <span>⏱</span>
                                                    <span className="uppercase tracking-wider">{project.duration}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 border-t border-white/5 pt-4 mt-auto">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[9px] text-emerald-400 font-black border border-emerald-500/20">
                                            {(project.profiles?.full_name ?? 'E')[0]}
                                        </div>
                                        <span className="text-[9px] font-black tracking-widest text-gray-500 uppercase">
                                            Lead: {project.profiles?.full_name || 'Anonymous'}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
