import { createClient } from '@/app/lib/supabase/server'
import { getDepartmentFromRollNumber } from '@/app/lib/utils/departmentMapper'
import { isCoreMember } from '@/app/lib/utils/coreAuth'
import { CommandCenterClient } from '@/app/components/CommandCenterClient'
import { AboutSection } from '@/app/components/AboutSection'
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
        // Fetch Materials count for analytics
        const { count: totalMaterialCount } = await supabase.from('notes').select('*', { count: 'exact', head: true })

        // Fetch View count for analytics
        const { count: totalViews } = await supabase
            .from('interaction_logs')
            .select('*, profiles!inner(role)', { count: 'exact', head: true })
            .eq('profiles.role', 'member')

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const { count: recentViews } = await supabase
            .from('interaction_logs')
            .select('*, profiles!inner(role)', { count: 'exact', head: true })
            .eq('profiles.role', 'member')
            .gte('created_at', sevenDaysAgo.toISOString())

        const { data: profiles } = await supabase
            .from('profiles')
            .select('department, role, year, roll_number')
            .eq('role', 'member')

        const deptMap: Record<string, number> = {}
        const yearMap: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0 }

        profiles?.forEach((p) => {
            const dept = getDepartmentFromRollNumber(p.roll_number) || p.department || 'Other'
            deptMap[dept] = (deptMap[dept] || 0) + 1

            if (p.year && p.year >= 1 && p.year <= 4) {
                yearMap[p.year.toString()] = (yearMap[p.year.toString()] || 0) + 1
            }
        })

        const { data: recentInteractions } = await supabase
            .from('interaction_logs')
            .select('created_at, profiles!inner(role)')
            .eq('profiles.role', 'member')
            .gte('created_at', sevenDaysAgo.toISOString())

        const weeklyActivity = [0, 0, 0, 0, 0, 0, 0]
        if (recentInteractions) {
            const now = new Date()
            recentInteractions.forEach(log => {
                const dayDiff = Math.floor((now.getTime() - new Date(log.created_at).getTime()) / (1000 * 60 * 60 * 24))
                if (dayDiff >= 0 && dayDiff < 7) {
                    weeklyActivity[6 - dayDiff]++
                }
            })
        }

        const { data: recentLogs } = await supabase
            .from('interaction_logs')
            .select(`*, profiles!inner(full_name, role)`)
            .eq('profiles.role', 'member')
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

                <div className="mt-20">
                    <AboutSection />
                </div>
                <Footer />
            </div>
        </div>
    )
}
