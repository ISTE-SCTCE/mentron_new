import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/app/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    const { user, supabase } = await getAuthUser(request)

    // 1. Verify the caller is authenticated
    if (!user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify the caller is an admin (core, exec, or admin)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

    if (profile?.role !== 'core' && profile?.role !== 'exec' && profile?.role !== 'admin') {
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
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { profileId } = body

    if (!profileId) {
        return NextResponse.json(
            { error: 'profileId is required' },
            { status: 400 }
        )
    }

    // Prevent self-deletion
    if (profileId === user.id) {
        return NextResponse.json(
            { error: 'Cannot delete your own account here' },
            { status: 400 }
        )
    }

    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const db = adminKey
        ? createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ysllolnoyezfdllqocgv.supabase.co',
            adminKey,
            { auth: { persistSession: false } }
        )
        : supabase

    // 4. Delete the profile and verify affected row count
    const { data, error: deleteError } = await db
        .from('profiles')
        .delete()
        .eq('id', profileId)
        .select('id')

    if (deleteError) {
        console.error('User deletion error:', deleteError)
        return NextResponse.json(
            { error: deleteError.message || 'Failed to delete user profile' },
            { status: 500 }
        )
    }

    if (!data || data.length === 0) {
        return NextResponse.json(
            { error: 'User not found or deletion not permitted' },
            { status: 404 }
        )
    }

    // 5. If service role client is available, also delete from auth.users
    if (adminKey) {
        try {
            await db.auth.admin.deleteUser(profileId)
        } catch (authErr) {
            console.warn('Could not delete auth user (profile already deleted):', authErr)
        }
    }

    return NextResponse.json({ success: true, profileId, count: data.length })
}

