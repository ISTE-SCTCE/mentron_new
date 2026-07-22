import { createClient } from '@/app/lib/supabase/server'
import { EventsClient } from './EventsClient'

export const dynamic = 'force-dynamic'

export default async function EventsListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user ? await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle() : { data: null }

  const currentUserRole = profile?.role || user?.user_metadata?.role || 'member'

  const [eventsResult, eventCalResult] = await Promise.all([
    supabase.from('event').select('*').order('created_at', { ascending: false }),
    supabase.from('event_cal').select('*').order('created_at', { ascending: false }),
  ])

  const allEvents = [
    ...(eventsResult.data || []),
    ...(eventCalResult.data || []),
  ].map(e => ({
    id: e.id,
    title: e.event_name || e.title || 'Untitled Event',
    venue: e.venue || 'TBA',
    date: e.date || e.event_date || null,
    description: e.description || '',
    registration_required: e.registration_required || false,
  }))

  const { data: conceptsData } = await supabase
    .from('event_concepts')
    .select('id, user_id, title, description, created_at, profiles(full_name), event_concept_votes(vote_value, user_id)')
    .order('created_at', { ascending: false })

  return (
    <EventsClient
      events={allEvents}
      concepts={(conceptsData || []) as any}
      currentUserId={user?.id}
      currentUserRole={currentUserRole}
    />
  )
}
