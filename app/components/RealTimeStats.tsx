'use client'

import { createClient } from '@/app/lib/supabase/client'
import { useEffect, useState } from 'react'

interface Stats {
    studentCount: number
    execCount: number
    materialCount: number
    viewCount: number
    visitedCount: number
    deptStats: Record<string, number>
}

interface Props {
    initialStats: Stats
}

import { getDepartmentFromRollNumber } from '@/app/lib/utils/departmentMapper'

export function RealTimeStats({ initialStats }: Props) {
    const [stats, setStats] = useState<Stats>(initialStats)
    const [isRevealed, setIsRevealed] = useState(false)
    const supabase = createClient()

    const fetchStats = async () => {
        const { data: profiles } = await supabase.from('profiles').select('role, department, roll_number')
        if (profiles) {
            const studentCount = profiles.length
            const execCount = profiles.filter(p => p.role === 'exec').length
            const deptStats: Record<string, number> = {}
            profiles.forEach(p => {
                const fromRoll = getDepartmentFromRollNumber(p.roll_number)
                let dept = fromRoll !== 'Other' ? fromRoll : (p.department || 'Other')

                // Normalize "Other" variations and case-insensitive check
                const check = dept.toLowerCase().trim()
                if (['other', 'none', 'n/a', '', 'not assigned', 'undefined'].includes(check)) {
                    dept = 'Other'
                }

                deptStats[dept] = (deptStats[dept] || 0) + 1
            })

            setStats(prev => ({ ...prev, studentCount, execCount, deptStats }))
        }

        const { count: materialCount } = await supabase.from('notes').select('*', { count: 'exact', head: true })
        setStats(prev => ({ ...prev, materialCount: materialCount || 0 }))

        const { data: interactionLogs } = await supabase.from('interaction_logs').select('user_id')
        if (interactionLogs) {
            const viewCount = interactionLogs.length
            const visitedCount = new Set(interactionLogs.map(l => l.user_id)).size
            setStats(prev => ({ ...prev, viewCount, visitedCount }))
        }
    }

    useEffect(() => {
        fetchStats()

        const profilesChannel = supabase.channel('profiles_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchStats())
            .subscribe()

        const notesChannel = supabase.channel('notes_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => fetchStats())
            .subscribe()

        const logsChannel = supabase.channel('logs_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'interaction_logs' }, () => fetchStats())
            .subscribe()

        return () => {
            supabase.removeChannel(profilesChannel)
            supabase.removeChannel(notesChannel)
            supabase.removeChannel(logsChannel)
        }
    }, [])

    return (
        <div className="space-y-12">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass p-8 rounded-[2.5rem] group border border-white/5 bg-gradient-to-br from-blue-500/5 to-transparent">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Total Students</span>
                        <span className="text-blue-500 text-xl font-black">👥</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-black text-white">{stats.studentCount || 0}</h3>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-[10px] font-black text-emerald-500">LIVE</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-medium text-gray-500 mt-2 uppercase tracking-widest">Across all departments</p>
                </div>

                <div className="glass p-8 rounded-[2.5rem] group border border-white/5 bg-gradient-to-br from-purple-500/5 to-transparent">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em]">Unique Visitors</span>
                        <span className="text-purple-500 text-xl font-black">📡</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-black text-white">{stats.visitedCount || 0}</h3>
                        <span className="text-[10px] font-bold text-gray-500 tracking-tighter uppercase">Total Engaged</span>
                    </div>
                    <p className="text-[10px] font-medium text-gray-500 mt-2 uppercase tracking-widest">Active Members</p>
                </div>

                <div className="glass p-8 rounded-[2.5rem] group border border-white/5 bg-gradient-to-br from-amber-500/5 to-transparent">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Materials</span>
                        <span className="text-amber-500 text-xl font-black">📄</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-black text-white">{stats.materialCount || 0}</h3>
                        <span className="text-[10px] font-bold text-blue-500 tracking-tighter uppercase">Vault</span>
                    </div>
                    <p className="text-[10px] font-medium text-gray-500 mt-2 uppercase tracking-widest">Study resources</p>
                </div>

                <div className="glass p-8 rounded-[2.5rem] group border border-white/5 bg-gradient-to-br from-indigo-500/5 to-transparent">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Total Views</span>
                        <span className="text-indigo-500 text-xl font-black">👁️‍🗨️</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-black text-white">{stats.viewCount || 0}</h3>
                    </div>
                    <p className="text-[10px] font-medium text-gray-500 mt-2 uppercase tracking-widest">System-wide Reach</p>
                </div>
            </div>

            {/* Department Breakdown Section */}
            <div className="relative">
                {!isRevealed ? (
                    <div
                        onClick={() => setIsRevealed(true)}
                        className="glass p-12 rounded-[3.5rem] border border-blue-500/20 bg-gradient-to-br from-blue-600/10 to-purple-600/10 cursor-pointer overflow-hidden relative group transition-all hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/10 active:scale-95"
                    >
                        {/* Decorative elements */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all"></div>
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full group-hover:bg-purple-500/20 transition-all"></div>

                        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500 border border-white/10 group-hover:border-blue-500/30">
                                🛡️
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black tracking-[0.4em] text-blue-400 uppercase">Classified Insights</p>
                                <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">
                                    See the <span className="text-glow text-blue-500">Power of Our Community</span>
                                </h2>
                                <p className="text-gray-400 text-sm font-medium max-w-md">
                                    Deep-dive into the departmental distribution of Mentron's elite network.
                                </p>
                            </div>
                            <div className="pt-4">
                                <span className="px-8 py-3 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-widest group-hover:bg-blue-500 group-hover:text-white transition-all shadow-xl shadow-blue-500/20">
                                    Reveal Analytics
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="glass p-10 rounded-[3rem] border border-white/5 overflow-hidden relative group animate-in fade-in zoom-in duration-500">
                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <span className="text-9xl font-black">📊</span>
                        </div>

                        <div className="relative space-y-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase mb-2">Demographics</p>
                                    <h2 className="text-3xl font-black text-white tracking-tight">Departmental Split</h2>
                                </div>
                                <button
                                    onClick={() => setIsRevealed(false)}
                                    className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
                                >
                                    ✕ Hide
                                </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                                {Object.entries(stats.deptStats).sort((a, b) => b[1] - a[1]).map(([dept, count]) => (
                                    <div key={dept} className="space-y-2">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <span className="text-xs font-black text-white tracking-widest uppercase">{dept}</span>
                                            <span className="text-xl font-black text-blue-400">{count}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-1000"
                                                style={{ width: `${(count / stats.studentCount) * 100}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.1em]">
                                            {((count / stats.studentCount) * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
