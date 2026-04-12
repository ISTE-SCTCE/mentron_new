import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import { getDepartmentFromRollNumber } from '@/app/lib/utils/departmentMapper'
import { DashboardCalendar } from '@/app/components/DashboardCalendar'
import { ThemeSwitcher } from '@/app/components/ThemeSwitcher'
import { AboutSection } from '@/app/components/AboutSection'
import { Footer } from '@/app/components/Footer'
import { LiveActivityTicker } from '@/app/components/LiveActivityTicker'
import { FloatingBanner } from '@/app/components/FloatingBanner'
import { CyberPulseWidget } from '@/app/components/CyberPulseWidget'
import { MentronOrbWidget } from '@/app/components/MentronOrbWidget'
import { GlobalSearch } from '@/app/components/GlobalSearch'
import { isCoreMember } from '@/app/lib/utils/coreAuth'
import { EventBanner } from '@/app/components/EventBanner'

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
        <div className="flex flex-col min-h-screen text-[#ededed] pt-32 w-full">
            <div className="flex-1 w-full max-w-[1700px] mx-auto px-4 md:px-8 flex flex-col xl:flex-row gap-8 items-start">

                {/* Left side: Innovation Hub */}
                <div className="w-72 shrink-0 hidden xl:flex flex-col gap-6">
                    {/* Original Ticker */}
                    <LiveActivityTicker items={latestProjects || []} type="project" title="Projects" />

                    {/* Surprise Features Underneath */}
                    <CyberPulseWidget />
                </div>

                {/* Center Content */}
                <div className="flex-1 min-w-0 w-full xl:max-w-5xl mx-auto flex flex-col">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="w-10 h-[1px] bg-blue-500"></span>
                                <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">System Overview</p>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
                                {greeting}, <span className="text-glow text-blue-400">{displayName.split(' ')[0]}</span>
                            </h1>
                        </div>

                        <div className="flex items-center gap-6 w-full md:w-auto">
                            <ThemeSwitcher />
                            <GlobalSearch />
                        </div>
                    </header>

                    {/* Top Row: User Profile & Calendar */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* User Profile Card */}
                        <div className="glass-card flex flex-col items-center justify-center text-center space-y-6 h-full">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 p-[2px]">
                                    <div className="w-full h-full rounded-full bg-[#030303] flex items-center justify-center text-4xl font-black">
                                        {displayName[0]}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white">{displayName}</h2>
                                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">{displayRole}</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-white/5 w-full max-w-sm">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Department</span>
                                    <span className="text-white font-black">{displayDept}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Roll Number</span>
                                    <span className="text-white font-black uppercase">{displayRoll}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Academic Year</span>
                                    <span className="text-white font-black">{displayYear}</span>
                                </div>
                            </div>
                        </div>

                        {/* Calendar */}
                        <DashboardCalendar isExec={profile?.role === 'exec' || profile?.role === 'core'} />
                    </div>

                    {/* Bottom Row: Recent Activity & Interaction Hub */}
                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Recent Activity Mini-Feed */}
                        <section className="lg:col-span-1 space-y-8">
                            <div className="glass-card group h-full">
                                <h3 className="text-xs font-black tracking-[0.2em] text-blue-500 uppercase mb-8">Recent Activity</h3>
                                <div className="space-y-6">
                                    {activity && activity.length > 0 ? (
                                        activity.map((log: any) => (
                                            <div key={log.id} className="flex gap-4 items-start">
                                                <div className="w-10 h-10 rounded-xl glass bg-white/5 flex items-center justify-center text-sm shrink-0">
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
                                        <p className="text-xs text-gray-500 italic">No recent activity detected.</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Right Column: Interaction Hub */}
                        <section className="lg:col-span-2 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Quick Tiles */}
                                <Link href="/notes" className="glass-card group block">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all">
                                            📚
                                        </div>
                                        <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase">Academic</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-white group-hover:text-glow transition-all mb-4">Notes</h2>
                                    <p className="text-gray-400 font-medium leading-relaxed">SCTCE's unified knowledge hub.</p>
                                </Link>

                                <Link href="/leaderboard" className="glass-card group block bg-blue-500/5">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all">
                                            👑
                                        </div>
                                        <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase">Rankings</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-white group-hover:text-glow transition-all mb-4">Leaderboard</h2>
                                    <p className="text-gray-400 font-medium leading-relaxed">Top contributors this week.</p>
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Link href="/events" className="glass-card group block content-center">
                                    <div className="text-3xl mb-4 grayscale group-hover:grayscale-0 transition-all">⚡</div>
                                    <h3 className="text-xl font-black text-white group-hover:text-glow transition-all mb-1 tracking-tighter">Events</h3>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Upcoming</p>
                                </Link>

                                <Link href="/marketplace" className="glass-card group block content-center">
                                    <div className="text-3xl mb-4 grayscale group-hover:grayscale-0 transition-all">🛍️</div>
                                    <h3 className="text-xl font-black text-white group-hover:text-glow transition-all mb-1 tracking-tighter">Market</h3>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">TradeHub</p>
                                </Link>

                                <Link href="/gallery" className="glass-card group block content-center">
                                    <div className="text-3xl mb-4 grayscale group-hover:grayscale-0 transition-all">📸</div>
                                    <h3 className="text-xl font-black text-white group-hover:text-glow transition-all mb-1 tracking-tighter">Gallery</h3>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Memories</p>
                                </Link>
                            </div>

                            {/* Event Banner — everyone sees it; exec/core can also add events */}
                            <div className="mt-8">
                                <EventBanner canAddEvent={profile?.role === 'exec' || profile?.role === 'core'} />
                            </div>

                            {/* Admin Hub — exec/core only */}
                            {(profile?.role === 'exec' || profile?.role === 'core') && (
                                <div className="glass-card group border-blue-500/20 bg-blue-500/5 mt-8">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h3 className="text-xs font-black tracking-[0.2em] text-blue-500 uppercase mb-2">Admin Hub</h3>
                                            <p className="text-2xl font-black text-white">Power Tools Active</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-xl">
                                            ⚙️
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Link href="/admin/notes" className="glass glass-hover p-4 rounded-xl text-center font-black text-xs text-blue-400 uppercase tracking-widest">
                                            Upload
                                        </Link>
                                        <Link href="/admin/projects" className="bg-blue-600 hover:bg-blue-700 p-4 rounded-xl text-center font-black text-xs text-white uppercase tracking-widest transition-all">
                                            Manage
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Core Member Card — only visible to core members */}
                            {coreMember && (
                                <Link
                                    href="/core/members"
                                    className="glass-card group block border-purple-500/20 bg-purple-500/5 mt-8 hover:bg-purple-500/10 transition-all"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-xs font-black tracking-[0.2em] text-purple-400 uppercase mb-2">Member Control</h3>
                                            <p className="text-2xl font-black text-white group-hover:text-glow transition-all">Manage Members</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-xl">
                                            🔐
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium">
                                        View all members, promote to Executive or demote to Normal Member.
                                    </p>
                                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">
                                        <span>Open Member Control</span>
                                        <span>→</span>
                                    </div>
                                </Link>
                            )}
                        </section>
                    </div>
                </div>

                {/* Right side: Core & Marketplace */}
                <div className="w-72 shrink-0 hidden xl:flex flex-col gap-6">

                    {/* ULTRA BADASS Marketplace Poster (Original Top Placement) */}
                    <Link href="/marketplace" className="group flex-1 relative overflow-hidden rounded-[24px] block cursor-pointer" style={{ minHeight: '380px' }}>

                        {/* Deep void base */}
                        <div className="absolute inset-0 rounded-3xl" style={{ background: '#03000F' }} />

                        {/* Perspective grid floor */}
                        <div className="absolute inset-0 rounded-3xl overflow-hidden">
                            <div className="absolute bottom-0 left-0 right-0 h-52" style={{
                                backgroundImage: 'linear-gradient(to right, rgba(120,40,255,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,40,255,0.25) 1px, transparent 1px)',
                                backgroundSize: '32px 32px',
                                transform: 'perspective(200px) rotateX(55deg)',
                                transformOrigin: 'bottom center',
                                maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
                                WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'
                            }} />
                        </div>

                        {/* Purple nova top */}
                        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(150,30,255,0.55) 0%, rgba(90,0,180,0.2) 40%, transparent 70%)', filter: 'blur(20px)' }} />
                        {/* Cyan horizon bottom */}
                        <div className="absolute -bottom-8 left-0 right-0 h-32" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(0,210,255,0.35) 0%, transparent 70%)', filter: 'blur(12px)' }} />
                        {/* Center spark on hover */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: 'radial-gradient(circle, rgba(200,100,255,0.3) 0%, transparent 70%)', filter: 'blur(16px)' }} />

                        {/* Top neon accent line */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl" style={{ background: 'linear-gradient(90deg, transparent 0%, #7B2FFF 30%, #00D4FF 70%, transparent 100%)' }} />

                        {/* Corner brackets */}
                        <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-purple-500/60 rounded-tl-lg" />
                        <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-cyan-400/60 rounded-tr-lg" />
                        <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-cyan-400/60 rounded-bl-lg" />
                        <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-purple-500/60 rounded-br-lg" />

                        {/* Animated gradient border */}
                        <div className="absolute inset-0 rounded-3xl" style={{
                            border: '1px solid transparent',
                            background: 'linear-gradient(#03000F,#03000F) padding-box, linear-gradient(135deg,#7B2FFF,rgba(0,210,255,0.8),#FF2FBB,#7B2FFF) border-box',
                            animation: 'gradientShift 3s ease infinite',
                            backgroundSize: '200% 200%'
                        }} />

                        {/* CONTENT */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-5 gap-3">

                            {/* System status badge */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(123,47,255,0.15)', border: '1px solid rgba(123,47,255,0.4)' }}>
                                <span className="inline-flex relative h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
                                </span>
                                <span className="text-[8px] font-black tracking-[0.35em] uppercase" style={{ color: '#C084FC' }}>System Initializing</span>
                            </div>

                            {/* Icon — triple glow rings */}
                            <div className="relative my-1">
                                <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(123,47,255,0.15)', transform: 'scale(2.8)', animationDuration: '2.5s' }} />
                                <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(0,210,255,0.12)', transform: 'scale(2.0)', filter: 'blur(8px)' }} />
                                <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(123,47,255,0.25)', transform: 'scale(1.4)', filter: 'blur(4px)' }} />
                                <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500"
                                    style={{ background: 'linear-gradient(135deg, rgba(123,47,255,0.3), rgba(0,210,255,0.2))', border: '1px solid rgba(255,255,255,0.15)' }}>
                                    <span className="text-5xl">🛍️</span>
                                </div>
                            </div>

                            {/* Chrome holographic title */}
                            <div className="relative">
                                <div className="text-[8px] font-black tracking-[0.5em] uppercase mb-1.5" style={{ color: 'rgba(0,210,255,0.7)' }}>
                                    ─── Mentron ───
                                </div>
                                <h3 className="text-4xl font-black leading-none tracking-tighter uppercase" style={{
                                    background: 'linear-gradient(135deg, #FFFFFF 0%, #C084FC 35%, #00D4FF 65%, #FFFFFF 100%)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    filter: 'drop-shadow(0 0 20px rgba(123,47,255,0.6))'
                                }}>MARKET<br />PLACE</h3>
                                <div className="mx-auto mt-2 h-[2px] w-24" style={{ background: 'linear-gradient(90deg,#7B2FFF,#00D4FF)' }} />
                            </div>

                            {/* Tagline */}
                            <p className="text-[9px] leading-relaxed max-w-[200px]" style={{ color: 'rgba(180,180,210,0.6)' }}>
                                Buy · Sell · Trade — within the SCTCE tribe
                            </p>

                            {/* Neon CTA */}
                            <div className="relative mt-1 group-hover:scale-105 transition-transform duration-300">
                                <div className="absolute inset-0 rounded-2xl blur-md" style={{ background: 'linear-gradient(135deg,#7B2FFF,#00D4FF)', opacity: 0.6 }} />
                                <div className="relative px-6 py-2.5 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase text-white"
                                    style={{ background: 'linear-gradient(135deg,#5B0FE0,#0099CC)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                    ⚡ GET NOTIFIED
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* The Interactive 3D Core Underneath */}
                    <MentronOrbWidget />
                </div>
            </div>
            <style>{`
                @keyframes gradientShift {
                    0%{background-position:0% 50%}
                    50%{background-position:100% 50%}
                    100%{background-position:0% 50%}
                }
            `}</style>

            {/* The Ultra-Wide Floating Banner — Full Width at Bottom */}
            <div className="w-full mt-10 px-4 md:px-8 max-w-[1700px] mx-auto shrink-0 relative z-10">
                <FloatingBanner />
            </div>

            {/* About Mentron section right before footer */}
            <div className="w-full mt-16 pb-16 px-4 md:px-8 max-w-[1700px] mx-auto shrink-0 relative z-10">
                <AboutSection />
            </div>

            <div className="w-full shrink-0 relative z-20 mt-auto">
                <Footer />
            </div>
        </div >
    )
}
