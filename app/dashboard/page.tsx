import { createClient } from '@/app/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getDepartmentFromRollNumber } from '@/app/lib/utils/departmentMapper'
import { isCoreMember } from '@/app/lib/utils/coreAuth'
import { CommandCenterClient } from '@/app/components/CommandCenterClient'
import { Footer } from '@/app/components/Footer'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()
    const coreMember = await isCoreMember()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    // Dashboard Data
    const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Member'
    const displayRole = profile?.role || user?.user_metadata?.role || 'member'
    const displayRoll = profile?.roll_number || user?.user_metadata?.roll_number || 'N/A'
    const displayYear = profile?.year || user?.user_metadata?.year || 'N/A'

    const { data: latestProjects } = await supabase
        .from('projects')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5)

    const hours = new Date().getHours()
    const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'

    const identifiedDept = getDepartmentFromRollNumber(displayRoll)
    const displayDept = identifiedDept !== 'Other'
        ? identifiedDept
        : (profile?.department || user?.user_metadata?.department || 'Not Assigned')

    const dashboardData = {
        user,
        profile,
        coreMember,
        displayName,
        displayRole,
        displayRoll,
        displayYear,
        displayDept,
        greeting,
        latestProjects: latestProjects || []
    }

    // Analytics Data (Only fetched if exec/core)
    let analyticsData = null

    if (displayRole === 'exec' || displayRole === 'core') {
        // Use service-role client to bypass RLS — ensures core members see real values
        const db = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Fetch Materials count for analytics
        const { count: totalMaterialCount } = await db.from('notes').select('*', { count: 'exact', head: true })

        // Fetch all member profiles (service role = no RLS restriction)
        const { data: profiles } = await db
            .from('profiles')
            .select('id, department, role, year, roll_number')
            .eq('role', 'member')

        const memberIds: string[] = (profiles || []).map((p: any) => p.id).filter(Boolean)

        // Fetch View count for analytics (filter by member IDs, not RLS join)
        const { count: totalViews } = await db
            .from('interaction_logs')
            .select('id', { count: 'exact', head: true })
            .in('user_id', memberIds.length > 0 ? memberIds : ['__none__'])

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { count: recentViews } = await db
            .from('interaction_logs')
            .select('id', { count: 'exact', head: true })
            .in('user_id', memberIds.length > 0 ? memberIds : ['__none__'])
            .gte('created_at', sevenDaysAgo.toISOString())

        const deptMap: Record<string, number> = {}
        const yearMap: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0 }

        profiles?.forEach((p: any) => {
            const dept = getDepartmentFromRollNumber(p.roll_number) || p.department || 'Other'
            deptMap[dept] = (deptMap[dept] || 0) + 1

            if (p.year && p.year >= 1 && p.year <= 4) {
                yearMap[p.year.toString()] = (yearMap[p.year.toString()] || 0) + 1
            }
        })

        const { data: recentInteractions } = await db
            .from('interaction_logs')
            .select('created_at, user_id')
            .in('user_id', memberIds.length > 0 ? memberIds : ['__none__'])
            .gte('created_at', sevenDaysAgo.toISOString())

        const weeklyActivity = [0, 0, 0, 0, 0, 0, 0]
        if (recentInteractions) {
            const now = new Date()
            recentInteractions.forEach((log: any) => {
                const dayDiff = Math.floor((now.getTime() - new Date(log.created_at).getTime()) / (1000 * 60 * 60 * 24))
                if (dayDiff >= 0 && dayDiff < 7) {
                    weeklyActivity[6 - dayDiff]++
                }
            })
        }

        const { data: recentLogs } = await db
            .from('interaction_logs')
            .select('*')
            .in('user_id', memberIds.length > 0 ? memberIds : ['__none__'])
            .order('created_at', { ascending: false })
            .limit(10)

        analyticsData = {
            totalViews: totalViews || 0,
            recentViews: recentViews || 0,
            realStudentCount: profiles?.length || 0,
            totalMaterialCount: totalMaterialCount || 0,
            initialStats: {
                studentCount: profiles?.length || 0,
                materialCount: totalMaterialCount || 0,
                viewCount: totalViews || 0,
                deptStats: deptMap,
                yearStats: yearMap,
                weeklyActivity
            },
            initialLogs: (recentLogs as any) || []
        }
    }

    return (
        <div className="flex flex-col min-h-screen text-[#ededed] pt-16 md:pt-32 w-full pb-20">
            <div className="flex-1 w-full max-w-[1800px] mx-auto px-4 md:px-8">
                
                {/* 
                   Dual-Mode Command Center Client 
                   Handles toggle between Dashboard & Analytics
                */}
                <CommandCenterClient 
                    dashboardData={dashboardData as any} 
                    analyticsData={analyticsData} 
                />


                <Footer />
            </div>
        </div>
    )
}
