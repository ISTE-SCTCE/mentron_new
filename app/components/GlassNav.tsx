'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import {
    BookOpen,
    BrainCircuit,
    CalendarDays,
    FolderKanban,
    Home,
    LogOut,
    Settings,
    ShoppingBag,
    Trophy,
    UserRound,
} from 'lucide-react'

const primaryItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/notes', icon: BookOpen, label: 'Learn' },
    { href: '/events', icon: CalendarDays, label: 'Classes' },
    { href: '/projects', icon: FolderKanban, label: 'Practice' },
    { href: '/leaderboard', icon: Trophy, label: 'Rank' },
]

const secondaryItems = [
    { href: '/marketplace', icon: ShoppingBag, label: 'Store' },
    { href: '/societies', icon: BrainCircuit, label: 'Clubs' },
    { href: '/team', icon: UserRound, label: 'Mentors' },
    { href: '/settings', icon: Settings, label: 'Profile' },
]

export function GlassNav() {
    const pathname = usePathname()
    const supabase = createClient()
    const [drawerOpen, setDrawerOpen] = useState(false)

    useEffect(() => setDrawerOpen(false), [pathname])

    useEffect(() => {
        document.body.style.overflow = drawerOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [drawerOpen])

    const handleLogout = async () => {
        const confirmed = window.confirm('Logout from Mentron?')
        if (!confirmed) return
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

    return (
        <>
            <header className="fixed top-4 left-1/2 z-[1000] hidden w-[min(1120px,calc(100%-32px))] -translate-x-1/2 items-center justify-between rounded-[28px] border border-[#5d22d7]/10 bg-white/85 px-4 py-3 shadow-[0_18px_50px_rgba(58,31,122,0.14)] backdrop-blur-2xl md:flex">
                <Link href="/dashboard" className="flex items-center gap-3 rounded-2xl px-2 py-1">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5d22d7] text-lg font-black text-white shadow-[0_12px_24px_rgba(93,34,215,0.28)]">
                        M
                    </div>
                    <div className="leading-tight">
                        <p className="text-sm font-black text-[#241653]">Mentron</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a80aa]">Learning app</p>
                    </div>
                </Link>

                <nav className="flex items-center gap-1 rounded-2xl bg-[#f4efff] p-1.5">
                    {primaryItems.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition-all ${active
                                    ? 'bg-white text-[#5d22d7] shadow-[0_10px_22px_rgba(58,31,122,0.12)]'
                                    : 'text-[#756b96] hover:bg-white/70 hover:text-[#35245f]'
                                    }`}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="rounded-2xl border border-[#5d22d7]/10 bg-white px-4 py-2.5 text-sm font-black text-[#5d22d7] shadow-[0_10px_24px_rgba(58,31,122,0.1)] transition hover:-translate-y-0.5"
                    >
                        More
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff0f4] text-[#e11d48] transition hover:bg-[#ffe3ea]"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <div className="fixed bottom-4 left-1/2 z-[1000] flex w-[min(430px,calc(100%-24px))] -translate-x-1/2 items-center justify-between rounded-[26px] border border-[#5d22d7]/10 bg-white/92 p-2 shadow-[0_18px_46px_rgba(58,31,122,0.2)] backdrop-blur-2xl md:hidden">
                {primaryItems.slice(0, 4).map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-black transition ${active
                                ? 'bg-[#5d22d7] text-white shadow-[0_12px_24px_rgba(93,34,215,0.28)]'
                                : 'text-[#8b82a5] active:bg-[#f4efff]'
                                }`}
                        >
                            <Icon size={19} />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
                <button
                    onClick={() => setDrawerOpen(true)}
                    className="flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-black text-[#8b82a5] active:bg-[#f4efff]"
                >
                    <UserRound size={19} />
                    <span>Profile</span>
                </button>
            </div>

            <div className={`fixed inset-0 z-[1001] transition ${drawerOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
                <button
                    aria-label="Close menu"
                    onClick={() => setDrawerOpen(false)}
                    className="absolute inset-0 bg-[#201547]/30 backdrop-blur-sm"
                />
                <aside className={`absolute bottom-0 right-0 w-full rounded-t-[32px] bg-white p-5 shadow-[0_-18px_60px_rgba(58,31,122,0.22)] transition-transform duration-300 md:bottom-auto md:top-6 md:right-6 md:w-[360px] md:rounded-[30px] ${drawerOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-[120%] md:translate-y-0'}`}>
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ff8a24]">Quick options</p>
                            <h2 className="text-2xl font-black text-[#241653]">Your learning space</h2>
                        </div>
                        <button
                            onClick={() => setDrawerOpen(false)}
                            className="h-10 w-10 rounded-2xl bg-[#f4efff] text-[#5d22d7]"
                        >
                            x
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[...secondaryItems, ...primaryItems.slice(4)].map((item) => {
                            const Icon = item.icon
                            const active = isActive(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`rounded-2xl border p-4 transition ${active ? 'border-[#5d22d7]/30 bg-[#f4efff]' : 'border-[#5d22d7]/10 bg-[#fbf9ff] hover:border-[#5d22d7]/24'}`}
                                >
                                    <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${active ? 'bg-[#5d22d7] text-white' : 'bg-white text-[#5d22d7]'}`}>
                                        <Icon size={19} />
                                    </div>
                                    <p className="text-sm font-black text-[#241653]">{item.label}</p>
                                </Link>
                            )
                        })}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#fff0f4] px-4 py-4 text-sm font-black text-[#e11d48]"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </aside>
            </div>
        </>
    )
}
