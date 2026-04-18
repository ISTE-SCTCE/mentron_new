'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MapPin, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

interface Event {
    id: string
    event_name: string
    venue?: string
    date?: string
    description?: string
    external_url?: string
    image_url?: string
}

interface Props {
    events: Event[]
}

const OFFICIAL_EVENTS: Event[] = [
    {
        id: 'off-1',
        event_name: 'Mentron Reloaded',
        venue: 'Main Campus',
        date: '20 April Onwards',
        description: 'Back with power, purpose, and a whole new level. Join the ultimate guided learning experience.',
        external_url: 'https://istesctce.in/mentron.html',
        image_url: '/images/mentron_reloaded.jpg'
    },
    {
        id: 'off-2',
        event_name: 'i³ Internship Initiative',
        venue: 'Innovation Hub',
        date: 'Active',
        description: 'iraise to 3: Bridging the gap between academia and industry through strategic internships and mentorship.',
        external_url: 'https://istesctce.in/icube.html',
        image_url: '/images/i3_event.jpg'
    },
    {
        id: 'off-3',
        event_name: 'Understanding "C"',
        venue: 'Conference Room',
        date: 'Upcoming',
        description: 'A masterclass designed to simplify C programming concepts for developers at all levels.',
        external_url: 'https://istesctce.in/events.html',
        image_url: '/images/understanding_c.png'
    },
    {
        id: 'off-4',
        event_name: 'Web Genesis',
        venue: 'Digital Lab',
        date: 'Coming Soon',
        description: 'Dive deep into modern web development stacks, from frontend aesthetics to robust backend architecture.',
        external_url: 'https://istesctce.in/events.html'
    }
]

export function EventsBanner({ events }: Props) {
    // Merge Official events first, then database events
    const allEvents = [...OFFICIAL_EVENTS, ...events]
    const [page, setPage] = useState(0)
    const [direction, setDirection] = useState(0)

    const paginate = useCallback((newDirection: number) => {
        setDirection(newDirection)
        setPage(prev => (prev + newDirection + allEvents.length) % allEvents.length)
    }, [allEvents.length])

    // Auto-advance
    useEffect(() => {
        const timer = setInterval(() => {
            paginate(1)
        }, 8000)
        return () => clearInterval(timer)
    }, [paginate])

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    }

    const currentEvent = allEvents[page]

    return (
        <section className="relative w-full min-h-screen lg:min-h-[85vh] bg-[#030303]/60 backdrop-blur-3xl flex items-center justify-center overflow-hidden border-b border-white/10 mb-12 lg:mb-0">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={page}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }) => {
                        const swipe = Math.abs(offset.x) > 50 && Math.abs(velocity.x) > 500
                        if (swipe) {
                            paginate(offset.x > 0 ? -1 : 1)
                        }
                    }}
                    className="absolute inset-0 flex items-center justify-center px-6 md:px-12 py-32 lg:py-0"
                >
                    <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                        {/* Event Content */}
                        <div className="space-y-8 order-2 lg:order-1">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]"
                            >
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                {page < OFFICIAL_EVENTS.length ? 'Official Website Event' : 'Community Event'}
                            </motion.div>

                            <div className="space-y-4">
                                <motion.h2 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-4xl md:text-8xl font-black tracking-tighter text-white leading-[0.9] text-center lg:text-left"
                                >
                                    {currentEvent.event_name}
                                </motion.h2>
                                
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="flex flex-wrap gap-6 text-gray-500 font-bold uppercase tracking-widest text-[10px]"
                                >
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-blue-500" />
                                        {currentEvent.venue || 'TBA'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-blue-500" />
                                        {currentEvent.date || 'To be announced'}
                                    </div>
                                </motion.div>
                            </div>

                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-gray-400 text-base md:text-xl leading-relaxed max-w-xl pb-10 lg:pb-0 text-center lg:text-left"
                            >
                                {currentEvent.description || 'Join us for an incredible event experience at SCTCE.'}
                            </motion.p>

                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="pt-4 flex justify-center lg:justify-start"
                            >
                                <a 
                                    href={currentEvent.external_url || '/events'}
                                    target={currentEvent.external_url ? "_blank" : "_self"}
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-4 bg-white text-black px-8 py-4 md:px-10 md:py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all group relative z-40"
                                >
                                    {currentEvent.external_url ? 'Register Online' : 'Mark Interest'}
                                    <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                                </a>
                            </motion.div>
                        </div>

                        {/* Event Visual */}
                        <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
                             <div className="relative w-48 h-48 md:w-[500px] md:h-[500px]">
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="w-full h-full rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center overflow-hidden relative shadow-2xl"
                                >
                                    <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-3xl" />
                                    {currentEvent.image_url ? (
                                        <img 
                                            src={currentEvent.image_url} 
                                            alt={currentEvent.event_name}
                                            className="w-full h-full object-cover relative z-10"
                                        />
                                    ) : (
                                        <span className="text-7xl md:text-[12rem] relative z-10 filter drop-shadow-[0_0_50px_rgba(59,130,246,0.5)]">
                                            {page === 0 ? '🏆' : page === 1 ? '🎓' : page === 2 ? '💻' : '🌐'}
                                        </span>
                                    )}
                                </motion.div>
                             </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Overlay */}
            <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8 z-30">
                <button 
                    onClick={() => paginate(-1)}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white hover:text-black hover:border-white transition-all"
                >
                    <ChevronLeft size={20} />
                </button>
                
                <div className="flex gap-2">
                    {allEvents.map((_, i) => (
                        <button 
                            key={i}
                            onClick={() => {
                                setDirection(i > page ? 1 : -1)
                                setPage(i)
                            }}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === page ? 'w-8 bg-blue-500' : 'w-1.5 bg-white/10 hover:bg-white/30'}`}
                        />
                    ))}
                </div>
                
                <button 
                    onClick={() => paginate(1)}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white hover:text-black hover:border-white transition-all"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Event Number Background */}
            <div className="absolute top-1/2 -left-20 -translate-y-1/2 text-[30vw] font-black text-white/[0.02] select-none pointer-events-none transition-all duration-500">
                {page + 1}
            </div>
        </section>
    )
}
