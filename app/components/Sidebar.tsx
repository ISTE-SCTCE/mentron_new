'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'
import {
    LayoutGrid,
    BarChart3,
    Users,
    BookOpen,
    Zap,
    ShoppingBag,
    FlaskConical,
    Trophy,
    Image,
    Dna,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Settings
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
    { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/team', icon: Users, label: 'Team' },
    { href: '/notes', icon: BookOpen, label: 'Notes' },
    { href: '/events', icon: Zap, label: 'Events' },
    { href: '/marketplace', icon: ShoppingBag, label: 'Market' },
    { href: '/projects', icon: FlaskConical, label: 'Projects' },
    { href: '/leaderboard', icon: Trophy, label: 'Rankings' },
    { href: '/societies', icon: Dna, label: 'Societies' },
    { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = useState(false)

    return (
        <aside
            className={`fixed left-0 top-0 h-screen z-50 transition-all duration-500 ease-in-out flex flex-col items-center py-6
                ${isCollapsed ? 'w-20' : 'w-24'}
            `}
            style={{
                background: 'rgba(5, 5, 20, 0.98)',
                backdropFilter: 'blur(32px)',
                borderRight: '1px solid rgba(0, 255, 255, 0.1)',
                boxShadow: '10px 0 50px -10px rgba(0, 0, 0, 0.7)'
            }}
        >
            <div className="mb-10 relative">
                <Link href="/dashboard" className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:scale-110 active:scale-95 transition-all duration-300 group overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 translate-y-12 group-hover:translate-y-0 transition-transform duration-500" />
                    <span className="text-xl font-black relative z-10">M</span>
                </Link>
            </div>

            {/* Navigation Items - NO TERMINAL HERE */}
            <nav className="flex flex-col items-center gap-4 flex-1 w-full px-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/'))
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={item.label}
                            className={`
                                group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300
                                ${isActive
                                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5 active:scale-90 border border-transparent'
                                }
                            `}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="relative z-10 transition-transform group-hover:scale-110" />

                            {isActive && (
                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-cyan-400 shadow-[0_0_15px_#22d3ee]" />
                            )}

                            <span className="absolute left-16 px-4 py-2 rounded-xl bg-gray-950/90 border border-white/10 text-[10px] font-black text-cyan-400 uppercase tracking-widest whitespace-nowrap opacity-0 scale-90 translate-x-4 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none z-[100] shadow-2xl backdrop-blur-xl">
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </nav>

            {/* Footer Actions - ONLY LOGOUT AND COLLAPSE */}
            <div className="flex flex-col items-center gap-4 border-t border-white/5 pt-6 w-full px-3">
                <form action={logout}>
                    <button
                        type="submit"
                        title="System Logout"
                        className="group relative flex items-center justify-center w-12 h-12 rounded-2xl text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-300"
                    >
                        <LogOut size={20} />
                        <span className="absolute left-16 px-4 py-2 rounded-xl bg-gray-950/90 border border-white/10 text-[10px] font-black text-red-500 uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                            System Logout
                        </span>
                    </button>
                </form>

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="mt-2 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 text-gray-600 hover:text-cyan-400 transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>
        </aside>
    )
}
