import { createClient } from '@/app/lib/supabase/server'
import { EventsBanner } from '@/app/components/EventsBanner'
import { EventConceptsForum } from '@/app/components/EventConceptsForum'

export default async function EventsListPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Fetch user profile for role checking
    const { data: profile } = user ? await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle() : { data: null }
    
    const currentUserRole = profile?.role || user?.user_metadata?.role || 'member'

    const { data: events, error } = await supabase
        .from('event_cal')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Fetch events error:', error)
    }

    // Fetch Event Concepts and Votes
    const { data: conceptsData, error: conceptError } = await supabase
        .from('event_concepts')
        .select(`
            id, 
            user_id,
            title, 
            description, 
            created_at, 
            profiles(full_name),
            event_concept_votes(vote_value, user_id)
        `)
        .order('created_at', { ascending: false })

    if (conceptError) {
        console.error('Fetch concepts error:', conceptError)
    }

    return (
        <div className="min-h-screen text-[#ededed]">
            {/* ─── Immersive Full-Width Banner ─── */}
            <EventsBanner events={events ?? []} />

            {/* ─── Reddit-Style Event Concepts Forum ─── */}
            <EventConceptsForum 
                concepts={conceptsData as any || []} 
                currentUserId={user?.id}
                currentUserRole={currentUserRole}
            />
        </div>
    )
}
