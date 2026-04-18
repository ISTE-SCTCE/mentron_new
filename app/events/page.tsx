import { createClient } from '@/app/lib/supabase/server'
import { EventsBanner } from '@/app/components/EventsBanner'
import { EventConceptsForum } from '@/app/components/EventConceptsForum'
import { getDepartmentFromRollNumber } from '@/app/lib/utils/departmentMapper'

export default async function EventsListPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Fetch user profile for role checking
    const { data: profile } = user ? await supabase
        .from('profiles')
        .select('role, roll_number')
        .eq('id', user.id)
        .maybeSingle() : { data: null }
    
    const userDept = getDepartmentFromRollNumber(profile?.roll_number)
    
    const currentUserRole = profile?.role || user?.user_metadata?.role || 'member'

    // Fetch Official/Local events from both possible tables
    const [eventsResult, eventCalResult] = await Promise.all([
        supabase.from('event').select('*').order('created_at', { ascending: false }),
        supabase.from('event_cal')
            .select('*')
            .or(`department.eq.General,department.eq.${userDept}`)
            .order('created_at', { ascending: false })
    ])

    const mergedEvents = [
        ...(eventsResult.data || []),
        ...(eventCalResult.data || [])
    ].map(e => ({
        id: e.id,
        event_name: e.event_name || e.title || 'Untitled Event',
        venue: e.venue || 'TBA',
        date: e.date || e.event_date || 'Upcoming',
        description: e.description || ''
    }))

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
            <EventsBanner events={mergedEvents} />

            {/* ─── Reddit-Style Event Concepts Forum ─── */}
            <EventConceptsForum 
                concepts={conceptsData as any || []} 
                currentUserId={user?.id}
                currentUserRole={currentUserRole}
            />
        </div>
    )
}
