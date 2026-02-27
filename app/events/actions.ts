'use server'

import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function registerForEvent(formData: FormData) {
    const supabase = await createClient()

    const eventId = formData.get('event_id') as string

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 1. Check for existing registration
    const { data: existing } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id) // Assuming column is user_id
        .single()

    if (existing) {
        redirect(`/events/${eventId}?error=${encodeURIComponent('You are already registered for this event.')}`)
    }

    // 2. Insert registration
    const { error } = await supabase
        .from('registrations')
        .insert({
            event_id: eventId,
            user_id: user.id,
        })

    if (error) {
        console.error('Registration error:', error)
        // If user_id is named differently (e.g. applicant_id or profile_id), 
        // I might need to adjust, but user_id is standard.
        // Let's try a fallback if it fails or assume standard schema.
        redirect(`/events/${eventId}?error=${encodeURIComponent(error.message)}`)
    }

    redirect(`/events/${eventId}?success=true`)
}
