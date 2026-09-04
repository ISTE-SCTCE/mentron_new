import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import { registerForEvent } from '../actions'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Fetch event details
    const { data: event, error } = await supabase
        .from('event_cal')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !event) {
        return (
            <div className="min-h-screen text-white flex flex-col items-center justify-center p-4">
                <div className="glass-card p-8 sm:p-12 rounded-3xl text-center max-w-md w-full border-white/10">
                    <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
                    <p className="text-gray-400 text-sm mb-6">The requested event could not be found or has been removed.</p>
                    <Link href="/events" className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition-all">
                        ← Back to Events
                    </Link>
                </div>
            </div>
        )
    }

    // 2. Check registration status
    const { data: { user } } = await supabase.auth.getUser()
    const { data: registration } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', id)
        .eq('user_id', user?.id)
        .single()

    const isRegistered = !!registration

    return (
        <div className="min-h-screen text-[#ededed] p-4 sm:p-6 md:p-8 pt-20 sm:pt-28 md:pt-32">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 sm:mb-12">
                    <Link href="/events" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors mb-4 group">
                        <span className="group-hover:-translate-x-0.5 transition-transform">←</span> All Events
                    </Link>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-4 bg-gradient-to-r from-purple-400 via-cyan-300 to-white bg-clip-text text-transparent break-words">
                        {event.event_name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-300 font-medium">
                        <span className="px-3 py-1.5 rounded-xl glass border-white/10 flex items-center gap-2">
                            <span>📍</span> {event.venue}
                        </span>
                        {event.event_date && (
                            <span className="px-3 py-1.5 rounded-xl glass border-white/10 flex items-center gap-2">
                                <span>📅</span> {new Date(event.event_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </span>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                    <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                        <section className="glass-card p-6 sm:p-8 rounded-3xl border-white/10">
                            <h2 className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-4">About Event</h2>
                            <div className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                                {event.description || "Join us for this exciting event! More details will be shared soon."}
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-1">
                        <aside className="glass-card p-6 sm:p-8 rounded-3xl border-white/10 sticky top-24">
                            {isRegistered ? (
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                                        ✓
                                    </div>
                                    <h3 className="text-xl font-bold text-white">You&apos;re In!</h3>
                                    <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                                        You have successfully registered for this event. We look forward to seeing you there!
                                    </p>
                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Status</p>
                                        <p className="text-emerald-400 font-bold text-sm">CONFIRMED</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 text-center">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-white">Join the Event</h3>
                                        <p className="text-gray-400 text-xs sm:text-sm">
                                            Secure your spot today. Registration is free for all members.
                                        </p>
                                    </div>
                                    <form action={registerForEvent}>
                                        <input type="hidden" name="event_id" value={id} />
                                        <button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl shadow-[0_0_25px_rgba(112,0,223,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all text-xs sm:text-sm uppercase tracking-wider"
                                        >
                                            Register Now
                                        </button>
                                    </form>
                                    <p className="text-[10px] text-gray-500 italic">
                                        By clicking, you agree to our event participation guidelines.
                                    </p>
                                </div>
                            )}
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    )
}
