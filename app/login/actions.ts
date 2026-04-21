'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error || !user) {
        console.error('Login error:', error)
        redirect(`/login?error=${encodeURIComponent(error?.message || 'Login failed')}`)
    }

    // ── TWO-DEVICE PREVENTION LOGIC ──
    // 1. Generate unique session ID
    const newSessionId = crypto.randomUUID()

    // 2. Update profiles table
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ current_session_id: newSessionId })
        .eq('id', user.id)

    if (profileError) {
        console.error('Failed to update session ID:', profileError)
    }

    // 3. Set secure cookie
    const cookieStore = await cookies()
    cookieStore.set('mentron_sid', newSessionId, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    redirect('/dashboard')
}

export async function logout() {
    const supabase = await createClient()
    
    // Clear session in DB if user is logged in
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        await supabase
            .from('profiles')
            .update({ current_session_id: null })
            .eq('id', user.id)
    }

    // Clear Supabase session
    await supabase.auth.signOut()
    
    // Clear cookie
    const cookieStore = await cookies()
    cookieStore.delete('mentron_sid')
    
    redirect('/')
}
