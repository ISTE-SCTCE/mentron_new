import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/app/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    const { user, supabase } = await getAuthUser(request)

    // 1. Verify the caller is authenticated
    if (!user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify the caller is privileged (core, exec, admin, or leadership)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, iste_position, permissions')
        .eq('id', user.id)
        .maybeSingle()

    const isLeadership = profile?.iste_position === 'Chairman' || profile?.iste_position === 'Vice Chairman'
    const hasPermission = !!profile?.permissions?.can_promote_demote
    const isPrivileged = isLeadership || hasPermission || profile?.role === 'core' || profile?.role === 'exec' || profile?.role === 'admin'

    if (!isPrivileged) {
        return NextResponse.json(
            { error: 'Forbidden: Insufficient permissions' },
            { status: 403 }
        )
    }

    // 3. Parse request body
    let body;
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const { profileId, newRole } = body

    if (!profileId || !['member', 'exec'].includes(newRole)) {
        return NextResponse.json(
            { error: 'Invalid profileId or newRole' },
            { status: 400 }
        )
    }

    // 4. Update the profile role using service role client if available
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const db = adminKey
        ? createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ysllolnoyezfdllqocgv.supabase.co',
            adminKey,
            { auth: { persistSession: false } }
        )
        : supabase

    const { data: updatedRows, error: updateError } = await db
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId)
        .select('id')

    if (updateError) {
        console.error('Role update error:', updateError)
        return NextResponse.json(
            { error: updateError.message || 'Failed to update role' },
            { status: 500 }
        )
    }

    if (!updatedRows || updatedRows.length === 0) {
        return NextResponse.json(
            { error: 'Target user not found or role update not permitted' },
            { status: 404 }
        )
    }

    return NextResponse.json({ success: true, profileId, newRole, count: updatedRows.length })
}
