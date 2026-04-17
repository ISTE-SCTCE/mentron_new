import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import { EventsBanner } from '@/app/components/EventsBanner'

export default async function EventsListPage() {
    const supabase = await createClient()

    const { data: events, error } = await supabase
        .from('event_cal')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Fetch events error:', error)
    }

    return (
        <div className="min-h-screen text-[#ededed]">
            {/* ─── Immersive Full-Width Banner ─── */}
            <EventsBanner events={events ?? []} />

            {/* ─── Detailed Event Grid ─── */}
            <div className="p-4 md:p-8 pb-20 text-[#ededed]">
                <div className="max-w-[1800px] mx-auto">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 md:mb-16">
                        <div className="flex items-center gap-8">
                            <Link href="/dashboard" className="text-gray-500 hover:text-white transition-all text-sm font-bold uppercase tracking-widest">
                                ← Dashboard
                            </Link>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">Experiences</p>
                                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">All Events</h1>
                            </div>
                        </div>
                        <a
                            href="https://istesctce.in/events.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="glass glass-hover px-6 py-2.5 rounded-full text-xs font-black tracking-widest uppercase text-blue-400 border-blue-500/20 transition-all"
                        >
                            View on ISTE Site →
                        </a>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-8">
                        {events && events.length > 0 ? (
                            events.map((event) => (
                                <Link
                                    key={event.id}
                                    href={`/events/${event.id}`}
                                    className="glass glass-hover p-10 rounded-[2.5rem] flex flex-col group relative overflow-hidden h-80"
                                >
                                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <span className="text-8xl font-black">#</span>
                                    </div>

                                    <div className="space-y-4">
                                        <h2 className="text-3xl font-black leading-tight text-white group-hover:text-glow transition-all">
                                            {event.event_name}
                                        </h2>
                                        <p className="text-blue-500 text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-2">
                                            📍 {event.venue}
                                        </p>
                                    </div>
                                    <p className="text-gray-400 text-sm mt-6 font-medium line-clamp-3">
                                        {event.description || 'Join us for a session featuring industry experts and hands-on developer workshops.'}
                                    </p>

                                    <div className="mt-auto flex items-center gap-2 text-[10px] font-black tracking-widest text-white uppercase group-hover:gap-4 transition-all">
                                        View Event <span>→</span>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-full py-32 text-center glass rounded-[3rem] border-dashed">
                                <p className="text-gray-500 text-lg font-bold tracking-widest uppercase animate-pulse">Stay Tuned for New Events</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
