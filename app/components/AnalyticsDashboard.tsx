'use client'

import { createClient } from '@/app/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import { Users, FileText, Zap, ChevronRight, Activity, Clock } from 'lucide-react'
import { getDepartmentFromRollNumber } from '@/app/lib/utils/departmentMapper'

interface Stats {
    studentCount: number
    materialCount: number
    viewCount: number
    deptStats: Record<string, number>
    yearStats: Record<string, number>
    weeklyActivity: number[]
}

interface InteractionLog {
    id: string
    user_id: string
    item_type: string
    interaction_type: string
    created_at: string
    profiles: {
        full_name: string
    }
}

interface Props {
    initialStats: Stats
    initialLogs: InteractionLog[]
}

export function AnalyticsDashboard({ initialStats, initialLogs }: Props) {
    const [stats, setStats] = useState<Stats>({
        ...initialStats,
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0] // Default until fetched
    })
    const [logs, setLogs] = useState<InteractionLog[]>(initialLogs)
    const supabase = createClient()

    const fetchStats = useCallback(async () => {
        // Fetch Profiles (EXCLUDING EXEC/CORE)
        const { data: profiles } = await supabase
            .from('profiles')
            .select('role, department, roll_number, year')
            .eq('role', 'member')

        if (profiles) {
            const studentCount = profiles.length
            const deptStats: Record<string, number> = {}
            const yearStats: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0 }

            profiles.forEach(p => {
                // Dept calculation
                const fromRoll = getDepartmentFromRollNumber(p.roll_number)
                let dept = fromRoll !== 'Other' ? fromRoll : (p.department || 'Other')
                const check = dept.toLowerCase().trim()
                if (['other', 'none', 'n/a', '', 'not assigned', 'undefined'].includes(check)) {
                    dept = 'Other'
                }
                deptStats[dept] = (deptStats[dept] || 0) + 1

                // Year calculation
                if (p.year && p.year >= 1 && p.year <= 4) {
                    yearStats[p.year.toString()] = (yearStats[p.year.toString()] || 0) + 1
                }
            })

            setStats(prev => ({ ...prev, studentCount, deptStats, yearStats }))
        }

        // Fetch Weekly activity for Sparkline
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const { data: recentInteractions } = await supabase
            .from('interaction_logs')
            .select('created_at, profiles!inner(role)')
            .eq('profiles.role', 'member')
            .gte('created_at', sevenDaysAgo.toISOString())

        if (recentInteractions) {
            const activityByDay = [0, 0, 0, 0, 0, 0, 0]
            const now = new Date()
            recentInteractions.forEach(log => {
                const dayDiff = Math.floor((now.getTime() - new Date(log.created_at).getTime()) / (1000 * 60 * 60 * 24))
                if (dayDiff >= 0 && dayDiff < 7) {
                    activityByDay[6 - dayDiff]++
                }
            })
            setStats(prev => ({ ...prev, weeklyActivity: activityByDay }))
        }

        // Fetch Materials count
        const { count: materialCount } = await supabase.from('notes').select('*', { count: 'exact', head: true })
        setStats(prev => ({ ...prev, materialCount: materialCount || 0 }))

        // Fetch View count
        const { count: viewCount } = await supabase
            .from('interaction_logs')
            .select('*, profiles!inner(role)', { count: 'exact', head: true })
            .eq('profiles.role', 'member')
        setStats(prev => ({ ...prev, viewCount: viewCount || 0 }))

        // Fetch Recent Logs
        const { data: recentLogs } = await supabase
            .from('interaction_logs')
            .select(`
                *,
                profiles!inner ( full_name, role )
            `)
            .eq('profiles.role', 'member')
            .order('created_at', { ascending: false })
            .limit(10)

        if (recentLogs) {
            setLogs(recentLogs as any)
        }
    }, [supabase])

    useEffect(() => {
        fetchStats()

        const profileSub = supabase.channel('analytics-profiles')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchStats())
            .subscribe()

        const notesSub = supabase.channel('analytics-notes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => fetchStats())
            .subscribe()

        const logsSub = supabase.channel('analytics-logs')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'interaction_logs' }, () => fetchStats())
            .subscribe()

        return () => {
            supabase.removeChannel(profileSub)
            supabase.removeChannel(notesSub)
            supabase.removeChannel(logsSub)
        }
    }, [fetchStats, supabase])

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Top Row: Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4 gap-6">
                {/* Total Students */}
                <div className="glass-card group p-8 flex flex-col justify-between h-56 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
                        <Users size={80} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black tracking-[0.3em] text-blue-400 uppercase mb-2">Total Students</p>
                        <h2 className="text-6xl font-black text-white tracking-tighter">{stats.studentCount}</h2>
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Registered users
                    </p>
                </div>

                {/* Total Materials */}
                <div className="glass-card group p-8 flex flex-col justify-between h-56 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
                        <FileText size={80} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black tracking-[0.3em] text-purple-400 uppercase mb-2">Total Materials</p>
                        <h2 className="text-6xl font-black text-white tracking-tighter">{stats.materialCount}</h2>
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                        Study materials
                    </p>
                </div>

                {/* Performance Analytics */}
                <div className="glass-card bg-gradient-to-br from-blue-600/20 to-indigo-600/20 p-8 flex flex-col h-56 border-blue-500/30">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                <Zap size={18} />
                            </div>
                            <span className="text-xs font-black tracking-widest text-white uppercase">Performance Analytics</span>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live</span>
                        </div>
                    </div>

                    <div className="flex items-end justify-between flex-1">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">Total Views</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-white">{stats.viewCount}</span>
                                    <span className="text-[9px] font-bold text-emerald-500 uppercase">Live Data</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">Avg. Views/Material</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-white">
                                        {stats.materialCount > 0 ? (stats.viewCount / stats.materialCount).toFixed(1) : '0'}
                                    </span>
                                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Real-time</span>
                                </div>
                            </div>
                        </div>

                        {/* Sparkline Visualization (Real Data) */}
                        <div className="flex items-end gap-1 h-20 w-32 pb-2">
                            {stats.weeklyActivity.map((count, i) => {
                                const max = Math.max(...stats.weeklyActivity, 1)
                                const height = (count / max) * 100
                                return (
                                    <div
                                        key={i}
                                        className="flex-1 rounded-t-sm bg-blue-500/30 transition-all duration-300 hover:bg-blue-400"
                                        style={{ height: `${Math.max(height, 5)}%` }}
                                        title={`${count} interactions`}
                                    ></div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Distribution & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-8">
                {/* Student Distribution */}
                <div className="glass-card p-10 space-y-8">
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">Student Distribution (Dept)</h3>
                        <div className="h-1 w-12 bg-blue-500 mt-2"></div>
                    </div>
                    <div className="space-y-6">
                        {['ECE', 'CSE', 'EEE', 'ME', 'CE'].map(dept => (
                            <div key={dept} className="group cursor-default">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-xs font-black text-white tracking-widest uppercase group-hover:text-blue-400 transition-colors">{dept}</span>
                                    <span className="text-xs font-bold text-gray-500">{stats.deptStats[dept] || 0} students</span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500/40 group-hover:bg-blue-500 transition-all duration-700"
                                        style={{ width: `${stats.studentCount > 0 ? ((stats.deptStats[dept] || 0) / stats.studentCount) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Demographics */}
                <div className="glass-card p-10 space-y-8">
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">Academic Year Demographics</h3>
                        <div className="h-1 w-12 bg-purple-500 mt-2"></div>
                    </div>
                    <div className="space-y-8">
                        {[1, 2, 3, 4].map(year => (
                            <div key={year} className="group">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-black text-white tracking-widest uppercase">{year === 1 ? '1st' : year === 2 ? '2nd' : year === 3 ? '3rd' : '4th'} Year</span>
                                    <span className="text-xs font-bold text-gray-500">{stats.yearStats[year] || 0} students</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${year === 1 ? 'from-blue-600 to-indigo-600' : year === 2 ? 'from-indigo-600 to-purple-600' : year === 3 ? 'from-purple-600 to-pink-600' : 'from-pink-600 to-rose-600'} transition-all duration-1000`}
                                        style={{ width: `${stats.studentCount > 0 ? ((stats.yearStats[year] || 0) / stats.studentCount) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="glass-card p-10 space-y-8">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black text-white tracking-tight">Recent Activity</h3>
                        <Activity className="text-emerald-500 w-5 h-5 animate-pulse" />
                    </div>
                    <div className="space-y-6 relative">
                        {/* Timeline line */}
                        <div className="absolute left-[11px] top-2 bottom-2 w-[1px] bg-white/10"></div>

                        {logs.slice(0, 5).map((log) => (
                            <div key={log.id} className="flex gap-6 relative group">
                                <div className="mt-1.5 w-6 h-6 rounded-full bg-[#0A0A0A] border-4 border-emerald-500 flex-shrink-0 z-10 scale-75"></div>
                                <div className="space-y-1 group-hover:translate-x-1 transition-transform">
                                    <p className="text-xs font-bold text-white leading-tight">
                                        {log.interaction_type === 'view' ? 'Viewed' : 'Downloaded'} {log.item_type.replace('_', ' ')}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                        <span>{log.profiles?.full_name || 'Anonymous'}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="pt-4">
                            <button className="text-[10px] font-black tracking-widest uppercase text-blue-400 flex items-center gap-2 hover:text-blue-300 transition-colors">
                                View details <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
