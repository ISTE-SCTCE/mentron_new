'use client'

import { createClient } from '@/app/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import { Users, FileText, Zap, Activity, Clock, Upload, GitBranch } from 'lucide-react'
import { getDepartmentFromRollNumber } from '@/app/lib/utils/departmentMapper'
import { useRouter } from 'next/navigation'

interface Stats {
    studentCount: number
    materialCount: number
    viewCount: number
    deptStats: Record<string, number>
    yearStats: Record<string, number>
    weeklyActivity: number[]
}

interface ActivityItem {
    id: string
    title: string
    type: 'note' | 'project'
    uploader: string
    created_at: string
    // Routing metadata
    year?: number
    semester?: string
    department?: string
    subject?: string
}

interface Props {
    initialStats: Stats
    initialLogs?: any[]
}

export function AnalyticsDashboard({ initialStats }: Props) {
    const router = useRouter()
    const [supabase] = useState(() => createClient())
    const [stats, setStats] = useState<Stats>({
        ...initialStats,
        weeklyActivity: initialStats.weeklyActivity || [0, 0, 0, 0, 0, 0, 0]
    })
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])

    const fetchStats = useCallback(async () => {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('role, department, roll_number, year')
            .eq('role', 'member')

        if (profiles) {
            const studentCount = profiles.length
            const deptStats: Record<string, number> = {}
            const yearStats: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0 }

            profiles.forEach(p => {
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

            setStats(prev => ({ ...prev, studentCount, deptStats, yearStats }))
        }

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

        const { count: materialCount } = await supabase.from('notes').select('*', { count: 'exact', head: true })
        setStats(prev => ({ ...prev, materialCount: materialCount || 0 }))

        const { count: viewCount } = await supabase
            .from('interaction_logs')
            .select('*, profiles!inner(role)', { count: 'exact', head: true })
            .eq('profiles.role', 'member')
        setStats(prev => ({ ...prev, viewCount: viewCount || 0 }))
    }, [supabase])

    const fetchRecentActivity = useCallback(async () => {
        // Fetch recent note uploads
        const { data: recentNotes } = await supabase
            .from('notes')
            .select('id, title, created_at, year, semester, department, subject, file_url, profiles!notes_profile_id_fkey(full_name)')
            .order('created_at', { ascending: false })
            .limit(15) // fetch more so we can filter invalid ones

        // Fetch recent project submissions
        const { data: recentProjects } = await supabase
            .from('projects')
            .select('id, title, created_at, profiles(full_name)')
            .order('created_at', { ascending: false })
            .limit(5)

        const rawNotes = recentNotes || []

        // ── Verify each note's file exists in Cloudflare R2 ──
        let validNoteIds: string[] = rawNotes.map((n: any) => n.id)
        if (rawNotes.length > 0) {
            try {
                const res = await fetch('/api/notes/verify-activity', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ noteIds: rawNotes.map((n: any) => n.id) })
                })
                if (res.ok) {
                    const json = await res.json()
                    validNoteIds = json.validIds ?? validNoteIds
                } else {
                    validNoteIds = [] // Fail closed
                }
            } catch {
                // On error, fail closed
                validNoteIds = []
            }
        }

        const noteItems: ActivityItem[] = rawNotes
            .filter((n: any) => validNoteIds.includes(n.id))
            .slice(0, 8)
            .map((n: any) => ({
                id: n.id,
                title: n.title,
                type: 'note' as const,
                uploader: n.profiles?.full_name || 'Unknown',
                created_at: n.created_at,
                year: n.year,
                semester: n.semester,
                department: n.department,
                subject: n.subject
            }))

        const projectItems: ActivityItem[] = (recentProjects || []).map((p: any) => ({
            id: p.id,
            title: p.title,
            type: 'project' as const,
            uploader: p.profiles?.full_name || 'Unknown',
            created_at: p.created_at
        }))

        // Combine and sort by date
        const combined = [...noteItems, ...projectItems]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 8)

        setRecentActivity(combined)
    }, [supabase])

    useEffect(() => {
        fetchStats()
        fetchRecentActivity()

        const profileSub = supabase.channel('analytics-profiles')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchStats())
            .subscribe()

        const notesSub = supabase.channel('analytics-notes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => {
                fetchStats()
                fetchRecentActivity()
            })
            .subscribe()

        const projectsSub = supabase.channel('analytics-projects')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
                fetchRecentActivity()
            })
            .subscribe()

        const logsSub = supabase.channel('analytics-logs')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'interaction_logs' }, () => fetchStats())
            .subscribe()

        // Polling fallback every 30 seconds
        const pollInterval = setInterval(() => {
            fetchStats()
            fetchRecentActivity()
        }, 30000)

        return () => {
            supabase.removeChannel(profileSub)
            supabase.removeChannel(notesSub)
            supabase.removeChannel(projectsSub)
            supabase.removeChannel(logsSub)
            clearInterval(pollInterval)
        }
    }, [fetchStats, fetchRecentActivity, supabase])

    const timeAgo = (dateStr: string) => {
        const now = new Date()
        const date = new Date(dateStr)
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
        if (diff < 60) return 'just now'
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
        return `${Math.floor(diff / 86400)}d ago`
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Students */}
                <div className="glass-card group flex flex-col justify-between h-44 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
                        <Users size={60} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black tracking-[0.3em] text-blue-400 uppercase mb-2">Total Students</p>
                        <h2 className="text-5xl font-black text-white tracking-tighter">{stats.studentCount}</h2>
                    </div>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Registered members
                    </p>
                </div>

                {/* Total Materials */}
                <div className="glass-card group flex flex-col justify-between h-44 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
                        <FileText size={60} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black tracking-[0.3em] text-purple-400 uppercase mb-2">Study Materials</p>
                        <h2 className="text-5xl font-black text-white tracking-tighter">{stats.materialCount}</h2>
                    </div>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        Notes uploaded
                    </p>
                </div>

                {/* Performance */}
                <div className="glass-card bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex flex-col h-44 border-blue-500/30">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                <Zap size={14} />
                            </div>
                            <span className="text-[10px] font-black tracking-widest text-white uppercase">Engagement</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live</span>
                        </div>
                    </div>

                    <div className="flex items-end justify-between flex-1">
                        <div className="space-y-3">
                            <div>
                                <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-0.5">Total Views</p>
                                <span className="text-2xl font-black text-white">{stats.viewCount}</span>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-0.5">Avg/Material</p>
                                <span className="text-2xl font-black text-white">
                                    {stats.materialCount > 0 ? (stats.viewCount / stats.materialCount).toFixed(1) : '0'}
                                </span>
                            </div>
                        </div>

                        {/* Sparkline */}
                        <div className="flex items-end gap-0.5 h-14 w-24">
                            {stats.weeklyActivity.map((count, i) => {
                                const max = Math.max(...stats.weeklyActivity, 1)
                                const height = (count / max) * 100
                                return (
                                    <div
                                        key={i}
                                        className="flex-1 rounded-t-sm bg-blue-500/30 transition-all duration-300 hover:bg-blue-400"
                                        style={{ height: `${Math.max(height, 5)}%` }}
                                        title={`${count} interactions`}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Distribution + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Student Distribution (Dept) — Bar chart */}
                <div className="glass-card space-y-5">
                    <div>
                        <h3 className="text-lg font-black text-white tracking-tight">Dept Distribution</h3>
                        <div className="h-1 w-10 bg-blue-500 mt-1.5" />
                    </div>
                    <div className="space-y-3">
                        {Object.keys(stats.deptStats).sort((a, b) => (stats.deptStats[b] || 0) - (stats.deptStats[a] || 0)).map((dept, i) => {
                            const pct = stats.studentCount > 0 ? ((stats.deptStats[dept] || 0) / stats.studentCount) * 100 : 0
                            const colors = ['bg-blue-500', 'bg-purple-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500']
                            return (
                                <div key={dept} className="group cursor-default">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black text-white tracking-widest uppercase">{dept}</span>
                                        <span className="text-[10px] font-bold text-gray-500">{stats.deptStats[dept] || 0}</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-700`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Academic Year Demographics — Bar chart */}
                <div className="glass-card space-y-5">
                    <div>
                        <h3 className="text-lg font-black text-white tracking-tight">Year Distribution</h3>
                        <div className="h-1 w-10 bg-purple-500 mt-1.5" />
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(year => {
                            const count = stats.yearStats[year] || 0
                            const pct = stats.studentCount > 0 ? (count / stats.studentCount) * 100 : 0
                            const gradients = [
                                'from-blue-600 to-indigo-600',
                                'from-indigo-600 to-purple-600',
                                'from-purple-600 to-pink-600',
                                'from-pink-600 to-rose-600'
                            ]
                            return (
                                <div key={year}>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-[10px] font-black text-white tracking-widest uppercase">
                                            {year === 1 ? '1st' : year === 2 ? '2nd' : year === 3 ? '3rd' : '4th'} Year
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-500">{count}</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${gradients[year - 1]} rounded-full transition-all duration-1000`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Recent Activity — real note/project uploads */}
                <div className="glass-card space-y-5">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-black text-white tracking-tight">Recent Activity</h3>
                            <div className="h-1 w-10 bg-emerald-500 mt-1.5" />
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
                        </div>
                    </div>
                    <div className="space-y-3 relative">
                        {/* Timeline line */}
                        <div className="absolute left-[9px] top-2 bottom-2 w-[1px] bg-white/10" />

                        {recentActivity.length === 0 && (
                            <p className="text-xs text-gray-500 italic pl-6">No recent uploads yet.</p>
                        )}

                        {recentActivity.map((item) => (
                            <div 
                                key={item.id} 
                                onClick={() => {
                                    if (item.type === 'note') {
                                        const yearNum = item.year ?? 1
                                        const subSegment = item.subject ? `/${encodeURIComponent(item.subject)}` : ''
                                        if (yearNum === 1) {
                                            // Year 1 uses group codes (A/B/C/D), not dept
                                            router.push(`/notes/year/1/group/${item.department}/${item.semester}${subSegment}`)
                                        } else {
                                            router.push(`/notes/year/${yearNum}/dept/${item.department}/${item.semester}${subSegment}`)
                                        }
                                    } else {
                                        router.push(`/projects/${item.id}`)
                                    }
                                }}
                                className="flex gap-4 relative group cursor-pointer"
                            >
                                <div className={`mt-1 w-5 h-5 rounded-full flex-shrink-0 z-10 flex items-center justify-center ${item.type === 'note' ? 'bg-blue-500/20 border-2 border-blue-500' : 'bg-purple-500/20 border-2 border-purple-500'}`}>
                                    {item.type === 'note'
                                        ? <Upload size={8} className="text-blue-400" />
                                        : <GitBranch size={8} className="text-purple-400" />
                                    }
                                </div>
                                <div className="space-y-0.5 group-hover:translate-x-1 transition-transform min-w-0 flex-1">
                                    <p className="text-[10px] font-bold text-white leading-tight line-clamp-1 group-hover:text-blue-400 transition-colors">
                                        {item.type === 'note' ? '📂' : '🚀'} {item.title}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-bold uppercase tracking-widest text-glow-hover">
                                        <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black ${item.type === 'note' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'}`}>
                                            {item.type}
                                        </span>
                                        <span className="truncate">{item.uploader}</span>
                                        <span className="flex items-center gap-0.5 shrink-0">
                                            <Clock size={7} />
                                            {timeAgo(item.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
