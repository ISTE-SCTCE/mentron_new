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

    // 2. Verify the caller is a panel member
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'panel') {
        return NextResponse.json(
            { error: 'Forbidden: Not a panel member' },
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
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId)

    if (updateError) {
        console.error('Role update error:', updateError)
        return NextResponse.json(
            { error: 'Failed to update role' },
            { status: 500 }
        )
    }

    return NextResponse.json({ success: true, profileId, newRole })
}
