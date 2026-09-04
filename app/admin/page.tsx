import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import { Shield, Activity, Users, Briefcase, ArrowUpRight, Sparkles } from 'lucide-react'

export default async function AdminPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    const adminModules = [
        {
            title: 'Directory & Members',
            desc: 'Manage roles, view student records, and regulate member status.',
            href: '/core/members',
            icon: Users,
            badge: 'Directory',
            accent: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/20',
        },
        {
            title: 'Permission Board',
            desc: 'Configure granular authority for Executive and Core team members.',
            href: '/admin/permissions',
            icon: Shield,
            badge: 'IAM',
            accent: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/20',
        },
        {
            title: 'System Insights',
            desc: 'Track live interactions, note downloads, and audit platform activity.',
            href: '/admin/insights',
            icon: Activity,
            badge: 'Telemetry',
            accent: 'from-cyan-500/20 to-teal-500/20 text-cyan-400 border-cyan-500/20',
        },
        {
            title: 'Project Management',
            desc: 'Review submissions, evaluate applicant CVs, and publish open positions.',
            href: '/admin/projects',
            icon: Briefcase,
            badge: 'Projects',
            accent: 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/20',
        },
    ]

    return (
        <div className="min-h-screen pt-20 sm:pt-28 md:pt-32 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto text-[#ededed]">
            <header className="mb-10 sm:mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <Link
                        href="/dashboard"
                        className="text-xs font-bold uppercase tracking-widest text-[#8b9bb4] hover:text-white transition-colors flex items-center gap-1.5"
                    >
                        ← Dashboard
                    </Link>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="px-3 py-1 glass rounded-full text-[10px] font-black uppercase tracking-widest text-purple-400 border border-purple-500/20 flex items-center gap-1.5 shadow-lg shadow-purple-500/10">
                        <Sparkles size={11} /> Executive Console
                    </span>
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-space-grotesk">
                        Admin Command
                    </h1>
                    <p className="text-sm sm:text-base text-[#8b9bb4] max-w-2xl font-medium">
                        Centralized governance portal for ISTE Mentron executive and core leadership.
                    </p>
                </div>
            </header>

            {/* Overview Hero Card */}
            <section className="glass-card p-6 sm:p-8 md:p-10 rounded-3xl border-purple-500/20 shadow-2xl relative overflow-hidden mb-10 sm:mb-12">
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400 block mb-1">
                                Executive Profile
                            </span>
                            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                Welcome, {profile?.full_name || 'Leader'}
                            </h2>
                        </div>
                        {profile?.iste_position && (
                            <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                {profile.iste_position}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-[#8b9bb4] mb-8 max-w-2xl font-normal leading-relaxed">
                        You have privileged administrative access to Mentron operations. Select a control module below to manage platform data, privileges, and community submissions.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 sm:p-5 bg-white/[0.03] rounded-2xl border border-white/10 backdrop-blur-sm">
                            <p className="text-[10px] text-[#8b9bb4] uppercase tracking-[0.2em] font-black mb-1.5">
                                Authorization Role
                            </p>
                            <p className="text-xl sm:text-2xl font-black text-white capitalize">
                                {profile?.role || 'Core'}
                            </p>
                        </div>
                        <div className="p-4 sm:p-5 bg-white/[0.03] rounded-2xl border border-white/10 backdrop-blur-sm">
                            <p className="text-[10px] text-[#8b9bb4] uppercase tracking-[0.2em] font-black mb-1.5">
                                Department / Affiliation
                            </p>
                            <p className="text-xl sm:text-2xl font-black text-purple-400 truncate">
                                {profile?.department || 'ISTE SCTCE'}
                            </p>
                        </div>
                        <div className="p-4 sm:p-5 bg-white/[0.03] rounded-2xl border border-white/10 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
                            <p className="text-[10px] text-[#8b9bb4] uppercase tracking-[0.2em] font-black mb-1.5">
                                Security State
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-sm font-bold text-emerald-400">Authenticated Session</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modules Grid */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.25em] text-[#8b9bb4]">
                        Management Modules
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    {adminModules.map((module) => {
                        const Icon = module.icon
                        return (
                            <Link
                                key={module.href}
                                href={module.href}
                                className="group glass-card p-6 sm:p-7 rounded-3xl border-white/10 hover:border-purple-500/40 transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
                            >
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform text-white group-hover:text-purple-400">
                                            <Icon size={22} />
                                        </div>
                                        <div>
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${module.accent}`}>
                                                {module.badge}
                                            </span>
                                            <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors mt-1 tracking-tight">
                                                {module.title}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-[#8b9bb4] group-hover:text-white group-hover:bg-purple-600/30 transition-all">
                                        <ArrowUpRight size={18} />
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm text-[#8b9bb4] font-normal leading-relaxed">
                                    {module.desc}
                                </p>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
