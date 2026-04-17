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

export async function proposeEventConcept(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { error: 'Not authenticated' }

    const title = formData.get('title') as string
    const description = formData.get('description') as string

    if (!title || !description) return { error: 'Missing fields' }

    const { error } = await supabase
        .from('event_concepts')
        .insert({
            user_id: user.id,
            title,
            description
        })

    if (error) return { error: error.message }
    return { success: true }
}

export async function voteEventConcept(conceptId: string, voteValue: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    // Check for existing vote
    const { data: existingVote } = await supabase
        .from('event_concept_votes')
        .select('*')
        .eq('concept_id', conceptId)
        .eq('user_id', user.id)
        .single()

    if (existingVote) {
        if (existingVote.vote_value === voteValue) {
            // Toggle vote off if clicking the same button
            const { error } = await supabase.from('event_concept_votes').delete().eq('id', existingVote.id)
            if (error) return { error: error.message }
        } else {
            // Switch direction
            const { error } = await supabase.from('event_concept_votes').update({ vote_value: voteValue }).eq('id', existingVote.id)
            if (error) return { error: error.message }
        }
    } else {
        // Create new vote
        const { error } = await supabase.from('event_concept_votes').insert({
            concept_id: conceptId,
            user_id: user.id,
            vote_value: voteValue
        })
        if (error) return { error: error.message }
    }

    return { success: true }
}

export async function deleteEventConcept(conceptId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { error: 'Not authenticated' }

    // Fetch the concept and the user's role
    const [{ data: concept }, { data: profile }] = await Promise.all([
        supabase.from('event_concepts').select('user_id').eq('id', conceptId).maybeSingle(),
        supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    ])

    if (!concept) return { error: 'Concept not found' }

    const isOwner = concept.user_id === user.id
    const userRole = profile?.role || user.user_metadata?.role || 'member'
    const isAdmin = userRole === 'exec' || userRole === 'core'

    if (!isOwner && !isAdmin) {
        return { error: 'Unauthorized to delete this concept' }
    }

    const { error } = await supabase.from('event_concepts').delete().eq('id', conceptId)
    if (error) return { error: error.message }
    return { success: true }
}

