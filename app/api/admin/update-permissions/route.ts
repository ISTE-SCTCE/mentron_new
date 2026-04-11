import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    // 1. Verify caller is Chairman or Vice Chairman
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
        .from('profiles')
        .select('iste_position')
        .eq('id', user.id)
        .single()

    if (profile?.iste_position !== 'Chairman' && profile?.iste_position !== 'Vice Chairman') {
        return NextResponse.json({ error: 'Forbidden: Leadership only' }, { status: 403 })
    }

    // 2. Parse request
    const { targetUserId, permissions } = await request.json()
    if (!targetUserId || !permissions) {
        return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    // 3. Update permissions
    const { error } = await supabase
        .from('profiles')
        .update({ permissions })
        .eq('id', targetUserId)

    if (error) {
        console.error('Permission update error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
