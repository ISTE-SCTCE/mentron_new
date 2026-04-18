'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ThemeSwitcher } from '@/app/components/ThemeSwitcher'
import { GlobalSearch } from '@/app/components/GlobalSearch'
import { NotificationBell } from '@/app/components/NotificationBell'
import { DashboardCalendar } from '@/app/components/DashboardCalendar'
import { EventBanner } from '@/app/components/EventBanner'
import { AnalyticsDashboard } from '@/app/components/AnalyticsDashboard'
import { BarChart3, ArrowUpRight, Users, BookOpen, Activity } from 'lucide-react'

// Defining props based on previous dashboard and analytics structures
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
    analyticsData: AnalyticsData | null // null for non-exec members
}

export function CommandCenterClient({ dashboardData, analyticsData }: Props) {
    const {
        user, profile, coreMember, displayName, displayRole, displayRoll, displayYear, displayDept, greeting, latestProjects
    } = dashboardData

    const [isAnalyticsMode, setIsAnalyticsMode] = useState(false)
    const canViewAnalytics = (profile?.role === 'exec' || profile?.role === 'core') && analyticsData !== null

    return (
        <>
            {/* HERO GREETING WITH INLINE TOGGLE */}
            <header className="col-span-1 md:col-span-2 xl:col-span-4 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 xl:mb-12 gap-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-md">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="w-10 h-[1px] bg-blue-500"></span>
                        <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">
                            {isAnalyticsMode ? 'System Analytics' : 'System Overview'}
                        </p>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-white">
                        {isAnalyticsMode ? 'Metrics Hub' : <>{greeting}, <span className="text-glow text-blue-400">{displayName.split(' ')[0]}</span></>}
                    </h1>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
                    {/* Mode Toggle Switch (Only for Exec/Core) */}
                    {canViewAnalytics && (
                        <div className="glass p-1 rounded-full flex border border-white/10 relative">
                            {/* Animated Background Pill */}
                            <div
                                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-blue-600 rounded-full transition-transform duration-500 ease-out z-0 shadow-lg shadow-blue-500/30"
                                style={{ transform: isAnalyticsMode ? 'translateX(100%)' : 'translateX(0)' }}
                            />
                            
                            <button
                                onClick={() => setIsAnalyticsMode(false)}
                                className={`relative z-10 px-6 py-2.5 text-[10px] rounded-full font-black uppercase tracking-widest transition-colors duration-300 ${!isAnalyticsMode ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => setIsAnalyticsMode(true)}
                                className={`relative z-10 px-6 py-2.5 text-[10px] rounded-full font-black uppercase tracking-widest transition-colors duration-300 flex items-center gap-2 ${isAnalyticsMode ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                            >
                                <Activity size={12} className={isAnalyticsMode ? "animate-pulse" : ""} />
                                Analytics
                            </button>
                        </div>
                    )}

                    <div className="hidden md:flex bg-white/10 w-[1px] h-10"></div>
                    
                    <div className="flex items-center gap-4">
                        <ThemeSwitcher />
                        <GlobalSearch />
                        {user && <NotificationBell userId={user.id} />}
                    </div>
                </div>
            </header>

            {/* DASHBOARD MODE VIEW */}
            {!isAnalyticsMode && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 xl:grid-rows-[auto_auto_auto] animate-in slide-in-from-bottom-8 fade-in duration-700">
                    {/* 2. PROFILE CARD */}
                    <div className="xl:col-span-1 xl:row-span-2 glass-card flex flex-col items-center justify-center text-center space-y-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 p-[2px]">
                                <div className="w-full h-full rounded-full bg-[#030303] flex items-center justify-center text-4xl font-black uppercase">
                                    {displayName[0]}
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white">{displayName}</h1>
                                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">{displayRole}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-white/5 w-full">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 font-medium">Dept</span>
                                <span className="text-white font-black">{displayDept}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 font-medium">Roll</span>
                                <span className="text-white font-black uppercase">{displayRoll}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 font-medium">Year</span>
                                <span className="text-white font-black">{displayYear}</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. CALENDAR */}
                    <div className="xl:col-span-2 xl:row-span-2">
                        <DashboardCalendar isExec={profile?.role === 'exec' || profile?.role === 'core'} />
                    </div>

                    {/* 4. ACTIVITY FEED / MULTI USE */}
                    <div className="xl:col-span-1 xl:row-span-2 glass-card overflow-hidden flex flex-col">
                        <h3 className="text-xs font-black tracking-[0.2em] text-blue-500 uppercase mb-8 shrink-0">Live Projects</h3>
                        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {latestProjects && latestProjects.length > 0 ? (
                                latestProjects.map((project: any) => (
                                    <Link key={project.id} href="/projects" className="flex gap-4 items-start group hover:bg-white/[0.04] p-3 -m-3 rounded-2xl transition-all">
                                        <div className="w-10 h-10 rounded-xl glass bg-blue-500/10 flex items-center justify-center text-sm shrink-0 group-hover:bg-blue-500/20 transition-colors">
                                            🚀
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-white leading-tight truncate">
                                                {project.title}
                                            </p>
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1 truncate">
                                                by {project.profiles?.full_name || 'Anonymous'}
                                            </p>
                                        </div>
                                        <ArrowUpRight size={12} className="text-gray-600 group-hover:text-blue-400 mt-1" />
                                    </Link>
                                ))
                            ) : (
                                <p className="text-xs text-gray-500 italic">No projects active.</p>
                            )}
                        </div>
                        <Link href="/projects" className="mt-8 text-[9px] font-black uppercase tracking-widest text-[#555] hover:text-white transition-colors flex items-center justify-center gap-2">
                            Browse All Projects <span className="text-xs">→</span>
                        </Link>
                    </div>

                    {/* 6. NOTES QUICK ACCESS */}
                    <Link href="/notes" className="xl:col-span-2 glass-card group flex flex-col justify-between hover:bg-white/[0.04] transition-all relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
                        
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all group-hover:scale-110">
                                📚
                            </div>
                            <span className="text-[9px] font-black tracking-widest text-blue-500 uppercase">Academic Hub</span>
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-white group-hover:text-glow transition-all mb-2">Notes & Materials</h2>
                            <p className="text-sm text-gray-400 font-medium max-w-md">Access SCTCE unified study hub with categorized university notes, PYQs, and resources.</p>
                        </div>
                    </Link>

                    {/* 7. LEADERBOARD QUICK ACCESS */}
                    <Link href="/leaderboard" className="xl:col-span-1 glass-card group flex flex-col justify-between hover:bg-white/[0.04] transition-all bg-purple-500/5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all group-hover:scale-110">
                                👑
                            </div>
                            <span className="text-[9px] font-black tracking-widest text-purple-400 uppercase">Rankings</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white group-hover:text-glow transition-all mb-1">Leaderboard</h2>
                            <p className="text-xs text-gray-400 font-medium">Top contributors</p>
                        </div>
                    </Link>

                    {/* 8. MARKETPLACE POSTER */}
                    <div className="xl:col-span-1 xl:row-span-2 relative h-full min-h-[400px]">
                        <Link href="/marketplace" className="group absolute inset-0 overflow-hidden rounded-[2.5rem] block border border-white/5 transition-all hover:border-blue-500/30">
                            <div className="absolute inset-0 bg-[#03000F]" />
                            <div className="absolute inset-0 rounded-3xl overflow-hidden">
                                <div className="absolute bottom-0 left-0 right-0 h-40 opacity-40" style={{
                                    backgroundImage: 'linear-gradient(to right, rgba(120,40,255,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,40,255,0.25) 1px, transparent 1px)',
                                    backgroundSize: '24px 24px',
                                    transform: 'perspective(200px) rotateX(55deg)',
                                    transformOrigin: 'bottom center',
                                }} />
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 rounded-full blur-2xl bg-blue-500/20 animate-pulse" />
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                                        🛍️
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-widest uppercase mb-1">Marketplace</h3>
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Live Trading</p>
                                </div>
                                <div className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest group-hover:bg-blue-500 transition-colors">
                                    Open TradeHub
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* 9. EVENT BANNER */}
                    <div className="xl:col-span-3">
                        <EventBanner canAddEvent={profile?.role === 'exec' || profile?.role === 'core'} />
                    </div>

                    {/* 10. ADMIN/CORE MODALS */}
                    <div className="xl:col-span-1 flex flex-col gap-4">
                        {(profile?.role === 'exec' || profile?.role === 'core') && (
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
                        )}
                        {coreMember && (
                            <Link href="/core/members" className="glass-card bg-purple-500/5 hover:bg-purple-500/10 transition-all group">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-black text-white group-hover:text-glow transition-all">Members Control</p>
                                    <span className="text-xl">🔐</span>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* ANALYTICS MODE VIEW */}
            {isAnalyticsMode && analyticsData && (
                <div className="animate-in slide-in-from-top-8 fade-in duration-700 mt-4">
                    <AnalyticsDashboard
                        initialStats={analyticsData.initialStats}
                        initialLogs={analyticsData.initialLogs}
                    />
                </div>
            )}
        </>
    )
}
