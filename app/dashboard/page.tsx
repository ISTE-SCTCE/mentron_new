import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import { getDepartmentFromRollNumber } from '@/app/lib/utils/departmentMapper'
import { DashboardCalendar } from '@/app/components/DashboardCalendar'
import { ThemeSwitcher } from '@/app/components/ThemeSwitcher'
import { AboutSection } from '@/app/components/AboutSection'
import { Footer } from '@/app/components/Footer'
import { LiveActivityTicker } from '@/app/components/LiveActivityTicker'
import { FloatingBanner } from '@/app/components/FloatingBanner'

import { GlobalSearch } from '@/app/components/GlobalSearch'
import { isCoreMember } from '@/app/lib/utils/coreAuth'
import { EventBanner } from '@/app/components/EventBanner'
import { NotificationBell } from '@/app/components/NotificationBell'

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

    // 2. Fetch Recent Activity (re-adding this)
    const { data: activity } = await supabase
        .from('interaction_logs')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(3)

    // Fallback logic: Use user_metadata if profile row is missing or fields are null
    const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Member'
    const displayRole = profile?.role || user?.user_metadata?.role || 'member'
    const displayRoll = profile?.roll_number || user?.user_metadata?.roll_number || 'N/A'
    const displayYear = profile?.year || user?.user_metadata?.year || 'N/A'

    // 4. Fetch data for live tickers
    const { data: latestProjects } = await supabase
        .from('projects')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5)

    const { data: latestItems } = await supabase
        .from('marketplace_items')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5)

    //Greeting Logic
    const hours = new Date().getHours()
    const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'

    const identifiedDept = getDepartmentFromRollNumber(displayRoll)
    const displayDept = identifiedDept !== 'Other'
        ? identifiedDept
        : (profile?.department || user?.user_metadata?.department || 'Not Assigned')

    return (
        <div className="flex flex-col min-h-screen text-[#ededed] pt-16 md:pt-32 w-full pb-20">
            <div className="flex-1 w-full max-w-[1800px] mx-auto px-4 md:px-8">

                {/* --- BENTO GRID CONTAINER --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 xl:grid-rows-[auto_auto_auto]">

                    {/* 1. HERO GREETING (Span Full Width on all) */}
                    <header className="col-span-1 md:col-span-2 xl:col-span-4 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 xl:mb-12 gap-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-md">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="w-10 h-[1px] bg-blue-500"></span>
                                <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">System Overview</p>
                            </div>
                            <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-white">
                                {greeting}, <span className="text-glow text-blue-400">{displayName.split(' ')[0]}</span>
                            </h1>
                        </div>

                        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                            <ThemeSwitcher />
                            <GlobalSearch />
                            {user && <NotificationBell userId={user.id} />}
                        </div>
                    </header>

                    {/* 2. PROFILE CARD (Top Left) */}
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

                    {/* 3. CALENDAR (Center Big) */}
                    <div className="xl:col-span-2 xl:row-span-2">
                        <DashboardCalendar isExec={profile?.role === 'exec' || profile?.role === 'core'} />
                    </div>

                    {/* 4. ACTIVITY FEED (Top Right) */}
                    <div className="xl:col-span-1 xl:row-span-2 glass-card overflow-hidden flex flex-col">
                        <h3 className="text-xs font-black tracking-[0.2em] text-blue-500 uppercase mb-8 shrink-0">Recent Activity</h3>
                        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                            {activity && activity.length > 0 ? (
                                activity.map((log: any) => (
                                    <div key={log.id} className="flex gap-4 items-start group">
                                        <div className="w-10 h-10 rounded-xl glass bg-white/5 flex items-center justify-center text-sm shrink-0 group-hover:bg-blue-500/10 transition-colors">
                                            {log.interaction_type === 'view' ? '👁️' : '📥'}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white leading-tight">
                                                {log.profiles?.full_name || 'Someone'} {log.interaction_type}ed a {log.item_type.replace('_', ' ')}
                                            </p>
                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1">
                                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-500 italic">No activity detected.</p>
                            )}
                        </div>
                    </div>

                    {/* --- SECOND MAJOR ROW --- */}

                    {/* 5. LIVE TICKER (Moved from Sidebar) */}
                    <div className="xl:col-span-1 glass-card bg-blue-500/[0.02]">
                        <LiveActivityTicker items={latestProjects || []} type="project" title="Live Projects" />
                    </div>

                    {/* 6. NOTES QUICK ACCESS */}
                    <Link href="/notes" className="xl:col-span-1 glass-card group flex flex-col justify-between hover:bg-white/[0.04] transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all group-hover:scale-110">
                                📚
                            </div>
                            <span className="text-[9px] font-black tracking-widest text-blue-500 uppercase">Academic</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white group-hover:text-glow transition-all mb-1">Notes</h2>
                            <p className="text-xs text-gray-400 font-medium">SCTCE Unified Hub</p>
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

                    {/* 8. MARKETPLACE POSTER (Moved from Sidebar) */}
                    <div className="xl:col-span-1 xl:row-span-2 relative h-full min-h-[400px]">
                        <Link href="/marketplace" className="group absolute inset-0 overflow-hidden rounded-[2.5rem] block border border-white/5 transition-all hover:border-blue-500/30">
                            {/* Reusing existing Marketplace visuals within the grid tile */}
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

                    {/* --- THIRD ROW --- */}

                    {/* 9. EVENT BANNER (Large Bottom Tile) */}
                    <div className="xl:col-span-3">
                        <EventBanner canAddEvent={profile?.role === 'exec' || profile?.role === 'core'} />
                    </div>

                    {/* 10. ADMIN/CORE MODALS (Compact Tile) */}
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

                {/* Footer and About sections remain centered but full-width adapted */}
                <div className="mt-20">
                    <AboutSection />
                </div>
                <Footer />
            </div>
        </div>
    )
}
