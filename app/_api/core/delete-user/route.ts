import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    // 1. Verify the caller is authenticated
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify the caller is an admin (core or exec)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
 
    if (profile?.role !== 'core' && profile?.role !== 'exec') {
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

    // Prevent self-deletion if needed (optional safety measure)
    if (profileId === user.id) {
        return NextResponse.json(
            { error: 'Cannot delete your own account here' },
            { status: 400 }
        )
    }

    // 4. Delete the profile (which effectively revokes access to the app)
    // Note: To completely delete the user from Supabase Auth, you would need
    // to use the Supabase Service Role Key: supabase.auth.admin.deleteUser(profileId)
    // Here we perform a profile deletion which relies on RLS logic.
    const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId)

    if (deleteError) {
        console.error('User deletion error:', deleteError)
        return NextResponse.json(
            { error: 'Failed to delete user account' },
            { status: 500 }
        )
    }

    return NextResponse.json({ success: true, profileId })
}
