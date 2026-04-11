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
            <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">Event not found</h1>
                <Link href="/events" className="text-blue-500 hover:underline">Back to Events</Link>
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
        <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12">
                    <Link href="/events" className="text-gray-400 hover:text-white transition-all mb-4 inline-block">
                        ← All Events
                    </Link>
                    <h1 className="text-6xl font-black tracking-tighter mb-4 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                        {event.event_name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 text-gray-400">
                        <span className="flex items-center gap-2">
                            <span className="text-blue-500">📍</span> {event.venue}
                        </span>
                        {event.event_date && (
                            <span className="flex items-center gap-2">
                                <span className="text-blue-500">📅</span> {new Date(event.event_date).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-[#171717] p-8 rounded-3xl border border-white/10">
                            <h2 className="text-xl font-bold mb-4 text-blue-500 uppercase tracking-widest text-xs">About Event</h2>
                            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {event.description || "Join us for this exciting event! More details will be shared soon."}
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-1">
                        <aside className="bg-[#171717] p-8 rounded-3xl border border-white/10 sticky top-8">
                            {isRegistered ? (
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto text-2xl">
                                        ✓
                                    </div>
                                    <h3 className="text-xl font-bold">You're In!</h3>
                                    <p className="text-gray-400 text-sm">
                                        You have successfully registered for this event. We look forward to seeing you there!
                                    </p>
                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-black">Status</p>
                                        <p className="text-green-500 font-bold">CONFIRMED</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 text-center">
                                    <h3 className="text-xl font-bold">Join the Event</h3>
                                    <p className="text-gray-400 text-sm">
                                        Secure your spot today. Registration is free for all members.
                                    </p>
                                    <form action={registerForEvent}>
                                        <input type="hidden" name="event_id" value={id} />
                                        <button
                                            type="submit"
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-2xl transition-all text-lg"
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
