import { createClient } from '@/app/lib/supabase/server'
import { getDepartmentFromRollNumber } from '@/app/lib/utils/departmentMapper'
import { AnalyticsDashboard } from '@/app/components/AnalyticsDashboard'

export default async function AnalyticsPage() {
    const supabase = await createClient()

    // 1. Fetch counts
    const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: materialCount } = await supabase.from('notes').select('*', { count: 'exact', head: true })
    const { count: viewCount } = await supabase.from('interaction_logs').select('*', { count: 'exact', head: true })

    // 2. Fetch profiles for distribution
    const { data: profiles } = await supabase.from('profiles').select('department, role, year, roll_number')

    const deptMap: Record<string, number> = {}
    const yearMap: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0 }

    profiles?.forEach((p) => {
        const dept = getDepartmentFromRollNumber(p.roll_number) || p.department || 'Other'
        deptMap[dept] = (deptMap[dept] || 0) + 1

        if (p.year && p.year >= 1 && p.year <= 4) {
            yearMap[p.year.toString()] = (yearMap[p.year.toString()] || 0) + 1
        }
    })

    // 3. Fetch recent interaction logs
    const { data: recentLogs } = await supabase
        .from('interaction_logs')
        .select(`
            *,
            profiles ( full_name )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

    const initialStats = {
        studentCount: profiles?.length || 0,
        materialCount: materialCount || 0,
        viewCount: viewCount || 0,
        deptStats: deptMap,
        yearStats: yearMap
    }

    return (
        <div className="min-h-screen p-8 pt-32 text-[#ededed] pb-24">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <header className="mb-16">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-10 h-[1px] bg-blue-500"></span>
                        <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">System Analytics</p>
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter text-white">Metrics Hub</h1>
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
