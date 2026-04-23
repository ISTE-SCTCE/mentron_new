import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/app/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getDepartmentFromRollNumber } from '@/app/lib/utils/departmentMapper'

export const dynamic = 'force-dynamic'

export async function GET() {
    // ── Auth check: only exec/core may call this ──
    const authClient = await createServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: callerProfile } = await authClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (callerProfile?.role !== 'exec' && callerProfile?.role !== 'core') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── Service-role client bypasses RLS for all queries ──
    const db = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Fetch all member profiles
    const { data: profiles } = await db
        .from('profiles')
        .select('id, role, department, roll_number, year')
        .eq('role', 'member')

    const studentCount = profiles?.length || 0
    const deptStats: Record<string, number> = {}
    const yearStats: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0 }

    profiles?.forEach((p: any) => {
        const fromRoll = getDepartmentFromRollNumber(p.roll_number)
        let dept = fromRoll !== 'Other' ? fromRoll : (p.department || 'Other')
        const check = dept.toLowerCase().trim()
        if (['other', 'none', 'n/a', '', 'not assigned', 'undefined'].includes(check)) {
            dept = 'Other'
        }
        deptStats[dept] = (deptStats[dept] || 0) + 1

        if (p.year && p.year >= 1 && p.year <= 4) {
            yearStats[p.year.toString()] = (yearStats[p.year.toString()] || 0) + 1
        }
    })

    // Build set of member user IDs for filtering
    const memberIds: string[] = (profiles || []).map((p: any) => p.id).filter(Boolean)

    // Total view count — filter to member interactions only
    const { count: viewCount } = await db
        .from('interaction_logs')
        .select('id', { count: 'exact', head: true })
        .in('user_id', memberIds.length > 0 ? memberIds : ['__none__'])

    // Weekly activity sparkline — filter to member interactions only
    const { data: recentInteractions } = await db
        .from('interaction_logs')
        .select('created_at, user_id')
        .gte('created_at', sevenDaysAgo.toISOString())
        .in('user_id', memberIds.length > 0 ? memberIds : ['__none__'])

    const weeklyActivity = [0, 0, 0, 0, 0, 0, 0]
    const now = new Date()
    ;(recentInteractions || []).forEach((log: any) => {
        const dayDiff = Math.floor((now.getTime() - new Date(log.created_at).getTime()) / (1000 * 60 * 60 * 24))
        if (dayDiff >= 0 && dayDiff < 7) {
            weeklyActivity[6 - dayDiff]++
        }
    })

    // Material count
    const { count: materialCount } = await db
        .from('notes')
        .select('id', { count: 'exact', head: true })

    return NextResponse.json({
        studentCount,
        materialCount: materialCount || 0,
        viewCount: viewCount || 0,
        deptStats,
        yearStats,
        weeklyActivity,
    })
}
