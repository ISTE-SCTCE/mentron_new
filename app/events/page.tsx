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

        </div>
    )
}
