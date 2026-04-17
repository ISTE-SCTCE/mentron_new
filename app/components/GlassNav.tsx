'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import {
    LayoutGrid,
    Users,
    BookOpen,
    ShoppingBag,
    FlaskConical,
    Trophy,
    LogOut,
    BarChart3,
    Menu,
    X,
    Zap,
    Settings
} from 'lucide-react'

export function GlassNav() {
    const pathname = usePathname()
    const supabase = createClient()
    const [mobileOpen, setMobileOpen] = useState(false)



    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false)
    }, [pathname])

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [mobileOpen])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    const navItems = [
        { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
        { href: '/analytics', icon: BarChart3, label: 'Analytics' },
        { href: '/events', icon: Zap, label: 'Events' },
        { href: '/notes', icon: BookOpen, label: 'Notes' },
        { href: '/projects', icon: FlaskConical, label: 'Projects' },
        { href: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
        { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
        { href: '/settings', icon: Settings, label: 'Settings' },
        { href: '/societies', icon: Users, label: 'Societies' },
    ]

    return (
        <>
            {/* ─── DESKTOP NAV (hidden on mobile) ─── */}
            <header className="fixed top-4 md:top-8 left-1/2 -translate-x-1/2 z-[1000] hidden md:flex items-center gap-4 transition-all duration-300 pointer-events-auto">

                {/* Logo */}
                <Link href="/dashboard" className="flex items-center justify-center w-14 h-14 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 p-2 shrink-0 transition-all hover:bg-white/10 hover:border-[#7000df] hover:shadow-[0_0_20px_rgba(112,0,223,0.25)]">
                    <span className="font-display font-black text-2xl tracking-tighter text-white">M</span>
                </Link>

                {/* Pill Navigation */}
                <nav className="flex items-center gap-2 px-6 py-3 rounded-full bg-black/10 backdrop-blur-3xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    group relative flex items-center gap-0 p-2 rounded-full overflow-hidden whitespace-nowrap
                                    transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                                    ${isActive ? 'bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] text-white pr-4 gap-2' : 'text-[#8b9bb4] hover:bg-white/10 hover:backdrop-blur-md hover:border-white/20 hover:text-white hover:pr-4 hover:gap-2'}
                                `}
                            >
                                <Icon size={20} className={`shrink-0 opacity-80 transition-opacity ${isActive ? 'opacity-100' : 'group-hover:opacity-100'}`} />
                                <span
                                    className={`
                                        text-[0px] opacity-0 max-w-0 font-medium transition-all duration-300
                                        ${isActive ? 'text-[0.85rem] opacity-100 max-w-[100px] block' : 'group-hover:text-[0.85rem] group-hover:opacity-100 group-hover:max-w-[100px]'}
                                    `}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        title="Logout"
                        className="group relative flex items-center gap-0 p-2 ml-4 rounded-full overflow-hidden whitespace-nowrap text-[#8b9bb4] hover:bg-[#ff0055]/20 hover:border-[#ff0055]/40 hover:text-[#ff0055] hover:pr-4 hover:gap-2 transition-all duration-300"
                    >
                        <LogOut size={20} className="shrink-0 opacity-80 group-hover:opacity-100" />
                        <span className="text-[0px] opacity-0 max-w-0 font-medium transition-all duration-300 group-hover:text-[0.85rem] group-hover:opacity-100 group-hover:max-w-[100px] block">
                            Logout
                        </span>
                    </button>
                </nav>
            </header>

            {/* ─── MOBILE: Top-left Logo + Top-right Hamburger ─── */}
            <div className="fixed top-0 left-0 right-0 z-[1000] md:hidden flex items-center justify-between px-4 py-3 pointer-events-auto"
                style={{ background: 'rgba(3,3,5,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Mobile Logo */}
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <span className="font-black text-lg text-white">M</span>
                    </div>
                    <span className="text-white font-black text-sm tracking-tight">Mentron</span>
                </Link>

                {/* Hamburger Toggle */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                    style={{
                        background: mobileOpen ? 'rgba(112,0,223,0.3)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${mobileOpen ? 'rgba(112,0,223,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    }}
                >
                    {mobileOpen
                        ? <X size={20} className="text-white" />
                        : <Menu size={20} className="text-white" />
                    }
                </button>
            </div>

            {/* ─── MOBILE FULL-SCREEN OVERLAY MENU ─── */}
            <div
                className={`fixed inset-0 z-[999] md:hidden flex flex-col transition-all duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                style={{ background: 'rgba(3,3,5,0.97)', backdropFilter: 'blur(32px)' }}
            >
                {/* Decorative glow blobs */}
                <div className="absolute top-0 left-0 w-72 h-72 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(112,0,223,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(0,198,255,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />

                {/* Menu content — starts below the mobile header bar */}
                <div className="flex-1 overflow-y-auto pt-20 pb-8 px-6 flex flex-col">
                    
                    {/* Nav Links */}
                    <nav className="flex flex-col gap-2 flex-1">
                        {navItems.map((item, i) => {
                            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                                        flex items-center gap-4 px-5 py-4 rounded-2xl font-semibold text-base transition-all duration-200
                                        ${isActive
                                            ? 'bg-[#7000df]/20 border border-[#7000df]/40 text-white shadow-[0_0_20px_rgba(112,0,223,0.15)]'
                                            : 'text-[#8b9bb4] border border-white/5 hover:bg-white/5 hover:text-white hover:border-white/10'
                                        }
                                    `}
                                    style={{
                                        animationDelay: `${i * 40}ms`,
                                        transform: mobileOpen ? 'translateX(0)' : 'translateX(-20px)',
                                        opacity: mobileOpen ? 1 : 0,
                                        transition: `transform 0.3s ease ${i * 40}ms, opacity 0.3s ease ${i * 40}ms, background 0.2s, border 0.2s, color 0.2s`
                                    }}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-[#7000df]/30' : 'bg-white/5'}`}>
                                        <Icon size={20} className={isActive ? 'text-[#a855f7]' : 'text-[#8b9bb4]'} />
                                    </div>
                                    <span>{item.label}</span>
                                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#a855f7]" />}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Logout at bottom */}
                    <div className="mt-6 pt-6 border-t border-white/5">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-semibold text-base text-[#ff4466] border border-[#ff4466]/20 hover:bg-[#ff4466]/10 hover:border-[#ff4466]/40 transition-all duration-200"
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#ff4466]/10 shrink-0">
                                <LogOut size={20} />
                            </div>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
