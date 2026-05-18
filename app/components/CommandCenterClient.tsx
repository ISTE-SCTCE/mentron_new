'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AnalyticsDashboard } from '@/app/components/AnalyticsDashboard'
import { DashboardCalendar } from '@/app/components/DashboardCalendar'
import { ProfileCard } from '@/app/components/ProfileCard'
import { getDepartmentFromRollNumber, getYearString } from '@/app/lib/utils/departmentMapper'
import { createClient } from '@/app/lib/supabase/client'
import {
    ArrowRight,
    BookOpen,
    CalendarDays,
    ClipboardCheck,
    FolderKanban,
    GraduationCap,
    Sparkles,
    Trophy,
} from 'lucide-react'

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

function ContinueLearningCard({ displayYear, displayDept }: { displayYear: string; displayDept: string }) {
    return (
        <section className="relative overflow-hidden rounded-[28px] bg-[#5d22d7] p-6 text-white shadow-[0_24px_56px_rgba(93,34,215,0.26)] md:p-8">
            <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-[#ffb11f]/35 blur-2xl" />
            <div className="absolute -bottom-20 left-8 h-48 w-48 rounded-full bg-[#10b981]/30 blur-2xl" />
            <div className="relative z-10 max-w-xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em]">
                    <Sparkles size={14} />
                    Study plan
                </div>
                <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
                    Pick up where you left off.
                </h1>
                <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-white/76">
                    Notes, classes, projects, and rankings are now arranged around your learning flow.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                    <Link href="/notes" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#5d22d7] shadow-lg transition hover:-translate-y-0.5">
                        Start learning
                        <ArrowRight size={16} />
                    </Link>
                    <Link href="/events" className="inline-flex items-center gap-2 rounded-2xl bg-white/14 px-5 py-3 text-sm font-black text-white ring-1 ring-white/20 transition hover:bg-white/20">
                        Today's classes
                    </Link>
                </div>
            </div>
            <div className="relative z-10 mt-8 grid grid-cols-2 gap-3 sm:max-w-md">
                <div className="rounded-2xl bg-white/14 p-4 ring-1 ring-white/15">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/60">Year</p>
                    <p className="mt-1 text-xl font-black">{displayYear}</p>
                </div>
                <div className="rounded-2xl bg-white/14 p-4 ring-1 ring-white/15">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/60">Department</p>
                    <p className="mt-1 text-xl font-black">{displayDept}</p>
                </div>
            </div>
        </section>
    )
}

function RecentActivityFeed() {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()
        const fetchActivity = async () => {
            const [{ data: notes }, { data: projects }] = await Promise.all([
                supabase
                    .from('notes')
                    .select('id, title, created_at, profiles!notes_profile_id_fkey(full_name)')
                    .order('created_at', { ascending: false })
                    .limit(4),
                supabase
                    .from('projects')
                    .select('id, title, created_at, profiles(full_name)')
                    .order('created_at', { ascending: false })
                    .limit(4),
            ])

            setItems([
                ...(notes || []).map((item: any) => ({ ...item, type: 'note' })),
                ...(projects || []).map((item: any) => ({ ...item, type: 'project' })),
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5))
            setLoading(false)
        }

        fetchActivity()
        const timer = window.setInterval(fetchActivity, 30000)
        return () => window.clearInterval(timer)
    }, [])

    return (
        <section className="glass-card h-full">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#10b981]">Live feed</p>
                    <h2 className="text-2xl font-black text-[#241653]">Fresh uploads</h2>
                </div>
                <span className="rounded-full bg-[#e9fbf3] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#059669]">Live</span>
            </div>
            {loading ? (
                <div className="h-32 animate-pulse rounded-2xl bg-[#f4efff]" />
            ) : (
                <div className="space-y-3">
                    {items.length === 0 && <p className="text-sm font-semibold text-[#7b739b]">No recent uploads yet.</p>}
                    {items.map((item) => (
                        <Link
                            key={`${item.type}-${item.id}`}
                            href={item.type === 'note' ? '/notes' : `/projects/${item.id}`}
                            className="flex items-center gap-3 rounded-2xl border border-[#5d22d7]/8 bg-[#fbf9ff] p-3 transition hover:border-[#5d22d7]/20 hover:bg-white"
                        >
                            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.type === 'note' ? 'bg-[#efe8ff] text-[#5d22d7]' : 'bg-[#fff4df] text-[#d97706]'}`}>
                                {item.type === 'note' ? <BookOpen size={18} /> : <FolderKanban size={18} />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-black text-[#241653]">{item.title}</p>
                                <p className="text-xs font-semibold text-[#8a80aa]">{item.type === 'note' ? 'Learning material' : 'Practice project'}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    )
}

export function CommandCenterClient({ dashboardData, analyticsData }: Props) {
    const { profile, coreMember, displayName, displayRole, displayRoll, displayYear, displayDept, greeting } = dashboardData
    const isExecOrCore = profile?.role === 'exec' || profile?.role === 'core'

    const quickActions = [
        { href: '/notes', label: 'Learn', detail: 'Notes and PYQs', icon: BookOpen, color: 'bg-[#efe8ff] text-[#5d22d7]' },
        { href: '/events', label: 'Classes', detail: 'Events and calendar', icon: CalendarDays, color: 'bg-[#e9fbf3] text-[#059669]' },
        { href: '/projects', label: 'Practice', detail: 'Projects and work', icon: FolderKanban, color: 'bg-[#fff4df] text-[#d97706]' },
        { href: '/leaderboard', label: 'Rank', detail: 'Contribution score', icon: Trophy, color: 'bg-[#fff0f4] text-[#e11d48]' },
    ]

    return (
        <div className="w-full pb-24 md:pb-10">
            <div className="mb-6 flex flex-col gap-2 md:mb-8">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#ff8a24]">{greeting}</p>
                <h1 className="text-3xl font-black tracking-tight text-[#241653] md:text-5xl">
                    Hi, {displayName.split(' ')[0]}
                </h1>
                <p className="text-sm font-semibold text-[#7b739b]">
                    {displayRole === 'core' ? 'Core Member' : displayRole === 'exec' ? 'Executive Member' : 'Member'} in {displayDept}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_0.8fr]">
                <ContinueLearningCard displayYear={displayYear} displayDept={displayDept} />
                <ProfileCard
                    displayName={displayName}
                    displayRole={displayRole}
                    displayDept={displayDept}
                    displayRoll={displayRoll}
                    displayYear={displayYear}
                />
            </div>

            <section className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {quickActions.map((action) => {
                    const Icon = action.icon
                    return (
                        <Link key={action.href} href={action.href} className="glass-card group min-h-[156px] p-4">
                            <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${action.color}`}>
                                <Icon size={21} />
                            </div>
                            <p className="text-xl font-black text-[#241653]">{action.label}</p>
                            <p className="mt-1 text-xs font-semibold text-[#8a80aa]">{action.detail}</p>
                            <ArrowRight className="absolute bottom-4 right-4 text-[#b5accd] transition group-hover:translate-x-1 group-hover:text-[#5d22d7]" size={18} />
                        </Link>
                    )
                })}
            </section>

            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_0.86fr]">
                <DashboardCalendar
                    isExec={isExecOrCore}
                    userDept={getDepartmentFromRollNumber(profile?.roll_number)}
                    userYear={getYearString(profile?.year)}
                />
                <RecentActivityFeed />
            </div>

            {isExecOrCore && analyticsData && (
                <div className="mt-5">
                    <AnalyticsDashboard initialStats={analyticsData.initialStats} initialLogs={analyticsData.initialLogs} />
                </div>
            )}

            {coreMember && (
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Link href="/core/members" className="glass-card flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#efe8ff] text-[#5d22d7]">
                            <GraduationCap size={21} />
                        </div>
                        <div>
                            <p className="text-lg font-black text-[#241653]">Manage members</p>
                            <p className="text-sm font-semibold text-[#8a80aa]">Roles and member access</p>
                        </div>
                    </Link>
                    <Link href="/admin/projects" className="glass-card flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff4df] text-[#d97706]">
                            <ClipboardCheck size={21} />
                        </div>
                        <div>
                            <p className="text-lg font-black text-[#241653]">Review projects</p>
                            <p className="text-sm font-semibold text-[#8a80aa]">Approve and manage submissions</p>
                        </div>
                    </Link>
                </div>
            )}
        </div>
    )
}
