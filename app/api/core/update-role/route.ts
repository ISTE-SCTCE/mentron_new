import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    // 1. Verify the caller is authenticated
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
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
    const body = await request.json()
    const { profileId, newRole } = body

    if (!profileId || !['member', 'exec'].includes(newRole)) {
        return NextResponse.json(
            { error: 'Invalid profileId or newRole' },
            { status: 400 }
        )
    }

    // 4. Update the profile role
    const { data: updatedRows, error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId)
        .select('id')

    if (updateError) {
        console.error('Role update error:', updateError)
        return NextResponse.json(
            { error: 'Failed to update role' },
            { status: 500 }
        )
    }

    if (!updatedRows || updatedRows.length === 0) {
        return NextResponse.json(
            { error: 'Forbidden: No rows were updated. Insufficient permissions or profile not found.' },
            { status: 403 }
        )
    }

    return NextResponse.json({ success: true, profileId, newRole })
}
