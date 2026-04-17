'use client'

import { Users, Calendar, Award, Zap, ArrowUpRight } from 'lucide-react'
import { useEffect, useState } from 'react'

const METRICS = [
    { label: 'Completed Events', value: 54, icon: Calendar, color: 'text-blue-500' },
    { label: 'Student Participation', value: '2.4k', icon: Users, color: 'text-purple-500' },
    { label: 'Workshops Hosted', value: 32, icon: Zap, color: 'text-emerald-500' },
    { label: 'Industry Awards', value: 8, icon: Award, color: 'text-rose-500' },
]

const LEGACY_EVENTS = [
    {
        title: "Tech Week '23",
        date: "Oct 2023",
        tags: ["Flagship", "Mega Event"],
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60",
        glow: "hover:shadow-[0_0_50px_rgba(59,130,246,0.2)]",
        borderColor: "border-blue-500/20"
    },
    {
        title: "Code-A-Thon IV",
        date: "Jan 2024",
        tags: ["Development", "24h"],
        image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60",
        glow: "hover:shadow-[0_0_50px_rgba(168,85,247,0.2)]",
        borderColor: "border-purple-500/20"
    },
    {
        title: "AI Masterclass",
        date: "Mar 2024",
        tags: ["Education", "Expert-Led"],
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=60",
        glow: "hover:shadow-[0_0_50px_rgba(16,185,129,0.2)]",
        borderColor: "border-emerald-500/20"
    },
    {
        title: "Women in Tech",
        date: "Feb 2024",
        tags: ["Community", "Diversity"],
        image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60",
        glow: "hover:shadow-[0_0_50px_rgba(244,63,94,0.2)]",
        borderColor: "border-rose-500/20"
    }
]

export function EventShowcase() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setIsVisible(true)
    }, [])

    return (
        <div className={`space-y-32 transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-12'}`}>
            
            {/* ─── Layer 1: The Impact Ticker ─── */}
            <div className="max-w-[1800px] mx-auto px-4">
                <div className="glass sky-glass p-8 md:p-12 rounded-[3.5rem] border-white/5 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 relative z-10">
                        {METRICS.map((metric, i) => (
                            <div key={i} className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-3">
                                <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${metric.color}`}>
                                    <metric.icon size={20} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                                        {metric.value}
                                    </h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                                        {metric.label}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Layer 2: Hall of Fame (Gallery) ─── */}
            <div className="max-w-[1800px] mx-auto px-4 pb-32">
                <header className="mb-16 space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-12 h-[1px] bg-blue-500" />
                        <p className="text-[10px] font-black tracking-[0.4em] text-blue-500 uppercase">Legacy</p>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white">Event Hall of Fame</h2>
                    <p className="text-gray-500 text-sm font-medium max-w-xl">
                        A retrospective look at the experiences that defined our community. 
                        Each event was a catalyst for innovation and student empowerment.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {LEGACY_EVENTS.map((event, i) => (
                        <div 
                            key={i} 
                            className={`glass-card p-6 rounded-[3rem] border ${event.borderColor} group cursor-default transition-all duration-500 hover:-translate-y-3 ${event.glow}`}
                        >
                            <div className="relative h-64 w-full rounded-[2rem] overflow-hidden mb-6 border border-white/5">
                                <img 
                                    src={event.image} 
                                    alt={event.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                <div className="absolute top-4 right-4 p-3 glass rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                    <ArrowUpRight size={16} className="text-white" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    {event.tags.map((tag, idx) => (
                                        <span key={idx} className="text-[8px] font-black uppercase tracking-widest text-white/40 bg-white/5 px-2.5 py-1 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-white tracking-tight">{event.title}</h3>
                                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{event.date}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ─── CTA: Be part of the future ─── */}
                <div className="mt-24 text-center">
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8">Ready to define the next legacy?</p>
                    <a 
                        href="https://istesctce.in/events.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass glass-hover px-10 py-5 rounded-full text-xs font-black tracking-[0.2em] text-white uppercase inline-block border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all shadow-xl hover:shadow-blue-500/20"
                    >
                        Propose an Event Concept →
                    </a>
                </div>
            </div>
        </div>
    )
}
