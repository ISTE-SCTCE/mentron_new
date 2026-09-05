import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/app/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    const { user, supabase } = await getAuthUser(request)

    // 1. Verify caller is Chairman or Vice Chairman
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
        .from('profiles')
        .select('iste_position')
        .eq('id', user.id)
        .maybeSingle()

    if (profile?.iste_position !== 'Chairman' && profile?.iste_position !== 'Vice Chairman') {
        return NextResponse.json({ error: 'Forbidden: Leadership only' }, { status: 403 })
    }

    // 2. Parse request
    let body;
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const { targetUserId, permissions } = body
    if (!targetUserId || !permissions) {
        return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    // 3. Update permissions using service role client if available (falls back to caller client)
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const db = adminKey
        ? createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ysllolnoyezfdllqocgv.supabase.co',
            adminKey,
            { auth: { persistSession: false } }
        )
        : supabase

    const { data, error } = await db
        .from('profiles')
        .update({ permissions })
        .eq('id', targetUserId)
        .select('id')

    if (error) {
        console.error('Permission update error:', error)
        return NextResponse.json({ error: error.message || 'Failed to update permissions' }, { status: 500 })
    }

    if (!data || data.length === 0) {
        return NextResponse.json({ error: 'Target user not found or update not permitted' }, { status: 404 })
    }

    return NextResponse.json({ success: true, count: data.length })
}

