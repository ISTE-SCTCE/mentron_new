import { createClient } from '@/app/lib/supabase/server'
import { getDepartmentFromRollNumber } from '@/app/lib/utils/departmentMapper'
import { AnalyticsDashboard } from '@/app/components/AnalyticsDashboard'
import Link from 'next/link'

export default async function AnalyticsPage() {
    const supabase = await createClient()

    // Role gate: only exec/panel
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id ?? '')
        .single()

    const role = profile?.role ?? 'member'
    const isPrivileged = role === 'exec' || role === 'core'

    if (!isPrivileged) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 text-[#ededed]">
                <div className="glass-card max-w-md text-center border-red-500/20 bg-red-500/5 space-y-4">
                    <div className="text-5xl">🔒</div>
                    <h1 className="text-2xl font-black text-white">Access Restricted</h1>
                    <p className="text-gray-400 text-sm">
                        The Analytics Hub is available to <strong className="text-white">Executive & Core members</strong> only.
                    </p>
                    <Link href="/dashboard" className="glass glass-hover px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest text-blue-400 border-blue-500/20 inline-block mt-4">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    // 1. Fetch counts (Real-time and filtered)
    const { count: materialCount } = await supabase.from('notes').select('*', { count: 'exact', head: true })
    const { count: viewCount } = await supabase.from('interaction_logs').select('*', { count: 'exact', head: true })

    // 2. Fetch profiles for distribution (EXCLUDING EXEC/CORE)
    const { data: profiles } = await supabase
        .from('profiles')
        .select('department, role, year, roll_number')
        .not('role', 'in', '("exec","core")')


    const deptMap: Record<string, number> = {}
    const yearMap: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0 }

    profiles?.forEach((p) => {
        const dept = getDepartmentFromRollNumber(p.roll_number) || p.department || 'Other'
        deptMap[dept] = (deptMap[dept] || 0) + 1

        if (p.year && p.year >= 1 && p.year <= 4) {
            yearMap[p.year.toString()] = (yearMap[p.year.toString()] || 0) + 1
        }
    })

    // 4. Fetch Weekly activity for initial state
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: recentInteractions } = await supabase
        .from('interaction_logs')
        .select('created_at')
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

    // 5. Fetch recent interaction logs
    const { data: recentLogs } = await supabase
        .from('interaction_logs')
        .select(`*, profiles ( full_name )`)
        .order('created_at', { ascending: false })
        .limit(10)

    const initialStats = {
        studentCount: profiles?.length || 0,
        materialCount: materialCount || 0,
        viewCount: viewCount || 0,
        deptStats: deptMap,
        yearStats: yearMap,
        weeklyActivity
    }

    return (
        <div className="min-h-screen p-4 md:p-8 pt-20 md:pt-32 text-[#ededed] pb-24">
            <div className="max-w-[1800px] mx-auto px-4">
                <header className="mb-16">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-10 h-[1px] bg-blue-500"></span>
                        <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">System Analytics</p>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">Metrics Hub</h1>
                    <p className="text-gray-500 text-sm font-medium mt-4 max-w-xl leading-relaxed">
                        System-wide statistics and performance metrics streaming in real-time.
                        Keep track of community engagement, content growth, and student demographics.
                    </p>
                </header>

                <AnalyticsDashboard
                    initialStats={initialStats}
                    initialLogs={(recentLogs as any) || []}
                />
            </div>
        </div>
    )
}


