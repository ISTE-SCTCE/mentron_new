'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { DashboardCalendar } from '@/app/components/DashboardCalendar'
import { AnalyticsDashboard } from '@/app/components/AnalyticsDashboard'
import { ProfileCard } from '@/app/components/ProfileCard'
import { getDepartmentFromRollNumber, getYearString } from '@/app/lib/utils/departmentMapper'
import { createClient } from '@/app/lib/supabase/client'
import { Upload, GitBranch, Clock, ArrowUpRight } from 'lucide-react'

interface Profile {
    id: string
    role: string
    full_name?: string
    roll_number?: string
    department?: string
    year?: number
}

interface DashboardData {
    user: any
    profile: Profile
    coreMember: boolean
    displayName: string
    displayRole: string
    displayRoll: string
    displayYear: string
    displayDept: string
    greeting: string
    latestProjects: any[]
}

interface AnalyticsData {
    totalViews: number
    recentViews: number
    realStudentCount: number
    totalMaterialCount: number
    initialStats: any
    initialLogs: any[]
}

interface Props {
    dashboardData: DashboardData
    analyticsData: AnalyticsData | null
}

interface ActivityItem {
    id: string
    title: string
    type: 'note' | 'project'
    uploader: string
    created_at: string
}

// Recent Activity Feed (for normal members replacing Live Projects)
function RecentActivityFeed() {
    const [supabase] = useState(() => createClient())
    const [activity, setActivity] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)

    const fetchActivity = useCallback(async () => {
        const { data: recentNotes } = await supabase
            .from('notes')
            .select('id, title, created_at, profiles!notes_profile_id_fkey(full_name)')
            .order('created_at', { ascending: false })
            .limit(5)

        const { data: recentProjects } = await supabase
            .from('projects')
            .select('id, title, created_at, profiles(full_name)')
            .order('created_at', { ascending: false })
            .limit(5)

        const noteItems: ActivityItem[] = (recentNotes || []).map((n: any) => ({
            id: `note-${n.id}`,
            title: n.title,
            type: 'note',
            uploader: n.profiles?.full_name || 'Unknown',
            created_at: n.created_at
        }))

        const projectItems: ActivityItem[] = (recentProjects || []).map((p: any) => ({
            id: `proj-${p.id}`,
            title: p.title,
            type: 'project',
            uploader: p.profiles?.full_name || 'Unknown',
            created_at: p.created_at
        }))

        const combined = [...noteItems, ...projectItems]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 8)

        setActivity(combined)
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchActivity()

        const notesSub = supabase.channel('member-notes-activity')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notes' }, fetchActivity)
            .subscribe()

        const projectsSub = supabase.channel('member-projects-activity')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'projects' }, fetchActivity)
            .subscribe()

        const poll = setInterval(fetchActivity, 30000)

        return () => {
            supabase.removeChannel(notesSub)
            supabase.removeChannel(projectsSub)
            clearInterval(poll)
        }
    }, [fetchActivity, supabase])

    const timeAgo = (dateStr: string) => {
        const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
        if (diff < 60) return 'just now'
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
        return `${Math.floor(diff / 86400)}d ago`
    }

    return (
        <div className="glass-card overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-xs font-black tracking-[0.2em] text-emerald-500 uppercase">Recent Activity</h3>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Live</span>
                </div>
            </div>

            {loading && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                </div>
            )}

            {!loading && (
                <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar flex-1 relative">
                    <div className="absolute left-[9px] top-2 bottom-2 w-[1px] bg-white/10" />
                    {activity.length === 0 && (
                        <p className="text-xs text-gray-500 italic pl-6">No recent uploads.</p>
                    )}
                    {activity.map((item) => (
                        <div key={item.id} className="flex gap-4 relative group">
                            <div className={`mt-0.5 w-5 h-5 rounded-full flex-shrink-0 z-10 flex items-center justify-center ${item.type === 'note' ? 'bg-blue-500/20 border-2 border-blue-500' : 'bg-purple-500/20 border-2 border-purple-500'}`}>
                                {item.type === 'note'
                                    ? <Upload size={8} className="text-blue-400" />
                                    : <GitBranch size={8} className="text-purple-400" />
                                }
                            </div>
                            <div className="space-y-0.5 group-hover:translate-x-1 transition-transform min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-white leading-tight line-clamp-2">
                                    {item.type === 'note' ? '📂' : '🚀'} {item.title}
                                </p>
                                <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-bold uppercase tracking-widest flex-wrap">
                                    <span className={`px-1 py-0.5 rounded text-[7px] font-black ${item.type === 'note' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'}`}>
                                        {item.type}
                                    </span>
                                    <span className="truncate max-w-[80px]">{item.uploader}</span>
                                    <span className="flex items-center gap-0.5 shrink-0 text-gray-600">
                                        <Clock size={7} />
                                        {timeAgo(item.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export function CommandCenterClient({ dashboardData, analyticsData }: Props) {
    const {
        user, profile, coreMember, displayName, displayRole, displayRoll, displayYear, displayDept, greeting
    } = dashboardData

    const isExecOrCore = profile?.role === 'exec' || profile?.role === 'core'
    const canViewAnalytics = isExecOrCore && analyticsData !== null

    return (
        <div className="w-full">
            {/* ── GREETING HEADER (top, above everything) ── */}
            <div className="mb-8 md:mb-10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-[1px] bg-blue-500" />
                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">System Overview</p>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
                    {greeting},{' '}
                    <span className="text-blue-400" style={{ textShadow: '0 0 30px rgba(96,165,250,0.5)' }}>
                        {displayName.split(' ')[0]}
                    </span>
                </h1>
                <p className="text-gray-500 font-medium mt-2 text-sm">
                    {displayRole === 'core' ? 'Core Member' : displayRole === 'exec' ? 'Executive Member' : 'Member'} · {displayDept}
                </p>
            </div>

            {/* ════════════════════════════════════════════════
                EXEC / CORE DASHBOARD LAYOUT
                ═══════════════════════════════════════════════ */}
            {isExecOrCore && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-700">

                    {/* Row 1: Profile + Analytics Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {/* Profile */}
                        <ProfileCard
                            displayName={displayName}
                            displayRole={displayRole}
                            displayDept={displayDept}
                            displayRoll={displayRoll}
                            displayYear={displayYear}
                        />

                        {/* Analytics inline */}
                        {canViewAnalytics && analyticsData && (
                            <div className="xl:col-span-2">
                                <AnalyticsDashboard
                                    initialStats={analyticsData.initialStats}
                                    initialLogs={analyticsData.initialLogs}
                                />
                            </div>
                        )}
                    </div>

                    {/* Row 2: Calendar (bigger) + Notes + Leaderboard */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {/* Calendar — bigger, takes 2 cols */}
                        <div className="xl:col-span-2">
                            <DashboardCalendar
                                isExec={true}
                                userDept={getDepartmentFromRollNumber(profile?.roll_number)}
                                userYear={getYearString(profile?.year)}
                            />
                        </div>

                        {/* Notes Quick Access */}
                        <Link href="/notes" className="xl:col-span-1 glass-card group flex flex-col justify-between hover:bg-white/[0.04] transition-all relative overflow-hidden">
                            <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all group-hover:scale-110">📚</div>
                                <span className="text-[9px] font-black tracking-widest text-blue-500 uppercase">Academic Hub</span>
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-2xl font-black text-white group-hover:text-glow transition-all mb-1">Notes & Materials</h2>
                                <p className="text-xs text-gray-400 font-medium">SCTCE unified study hub with categorized notes, PYQs.</p>
                            </div>
                        </Link>

                        {/* Leaderboard */}
                        <Link href="/leaderboard" className="xl:col-span-1 glass-card group flex flex-col justify-between hover:bg-white/[0.04] transition-all bg-purple-500/5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all group-hover:scale-110">👑</div>
                                <span className="text-[9px] font-black tracking-widest text-purple-400 uppercase">Rankings</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white group-hover:text-glow transition-all mb-1">Leaderboard</h2>
                                <p className="text-xs text-gray-400 font-medium">Top contributors</p>
                            </div>
                        </Link>
                    </div>


                        {/* Admin controls and Position Details */}
                        <div className="xl:col-span-4 flex flex-col md:flex-row gap-6">
                            <div className="glass-card flex-1 bg-blue-500/5 group">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-[10px] font-black tracking-widest text-blue-500 uppercase">Project Manager</h3>
                                    <span className="text-xl grayscale group-hover:grayscale-0 transition-all">⚙️</span>
                                </div>
                                <div className="flex gap-2">
                                    <Link href="/admin/notes" className="flex-1 glass glass-hover py-3 rounded-xl text-[10px] font-black text-blue-400 text-center uppercase">Upload</Link>
                                    <Link href="/admin/projects" className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl text-[10px] font-black text-white text-center uppercase transition-all">Manage</Link>
                                </div>
                            </div>

                            {coreMember && (
                                <Link href="/core/members" className="glass-card flex-1 bg-purple-500/5 hover:bg-purple-500/10 transition-all group">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-black text-white group-hover:text-glow transition-all">Manage Members</p>
                                        <span className="text-xl">🔐</span>
                                    </div>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-2">View & manage member roles</p>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════
                NORMAL MEMBER DASHBOARD LAYOUT
                ═══════════════════════════════════════════════ */}
            {!isExecOrCore && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 fade-in duration-700">

                    {/* Profile */}
                    <ProfileCard
                        displayName={displayName}
                        displayRole={displayRole}
                        displayDept={displayDept}
                        displayRoll={displayRoll}
                        displayYear={displayYear}
                        className="xl:col-span-1 xl:row-span-2"
                    />

                    {/* Calendar */}
                    <div className="xl:col-span-2">
                        <DashboardCalendar
                            isExec={false}
                            userDept={getDepartmentFromRollNumber(profile?.roll_number)}
                            userYear={getYearString(profile?.year)}
                        />
                    </div>

                    {/* Recent Activity (replaces Live Projects for members) */}
                    <div className="xl:col-span-1 xl:row-span-2">
                        <RecentActivityFeed />
                    </div>

                    {/* Notes */}
                    <Link href="/notes" className="xl:col-span-2 glass-card group flex flex-col justify-between hover:bg-white/[0.04] transition-all relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all group-hover:scale-110">📚</div>
                            <span className="text-[9px] font-black tracking-widest text-blue-500 uppercase">Academic Hub</span>
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-white group-hover:text-glow transition-all mb-2">Notes & Materials</h2>
                            <p className="text-sm text-gray-400 font-medium max-w-md">Access SCTCE unified study hub with categorized university notes, PYQs, and resources.</p>
                        </div>
                    </Link>

                    {/* Leaderboard */}
                    <Link href="/leaderboard" className="xl:col-span-1 glass-card group flex flex-col justify-between hover:bg-white/[0.04] transition-all bg-purple-500/5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all group-hover:scale-110">👑</div>
                            <span className="text-[9px] font-black tracking-widest text-purple-400 uppercase">Rankings</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white group-hover:text-glow transition-all mb-1">Leaderboard</h2>
                            <p className="text-xs text-gray-400 font-medium">Top contributors</p>
                        </div>
                    </Link>

                </div>
            )}
        </>
    )
}
