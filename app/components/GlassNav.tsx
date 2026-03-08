'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import {
    LayoutGrid,
    Users,
    BookOpen,
    Image as ImageIcon,
    ShoppingBag,
    FlaskConical,
    Trophy,
    LogOut,
    BarChart3
} from 'lucide-react'

export function GlassNav() {
    const pathname = usePathname()
    const supabase = createClient()
    const [userRole, setUserRole] = useState<string | null>(null)

    useEffect(() => {
        async function fetchUserRole() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (profile) {
                    setUserRole(profile.role)
                }
            }
        }
        fetchUserRole()
    }, [supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    const navItems = [
        { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
        { href: '/analytics', icon: BarChart3, label: 'Analytics' },
        { href: '/events', icon: Trophy, label: 'Events' },
        { href: '/societies', icon: Users, label: 'Societies' },
        { href: '/notes', icon: BookOpen, label: 'Notes' },
        { href: '/projects', icon: FlaskConical, label: 'Projects' },
        { href: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
    ]

    return (
        <header className="fixed top-4 md:top-8 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 md:gap-4 transition-all duration-300 pointer-events-auto max-w-[calc(100vw-1rem)] w-auto">

            {/* Logo */}
            <Link href="/dashboard" className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 p-2 shrink-0 transition-all hover:bg-white/10 hover:border-[#7000df] hover:shadow-[0_0_20px_rgba(112,0,223,0.25)]">
                <span className="font-display font-black text-xl md:text-2xl tracking-tighter text-white">M</span>
            </Link>

            {/* Pill Navigation — scrollable on mobile */}
            <nav className="flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-full bg-black/10 backdrop-blur-3xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-x-auto no-scrollbar">
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
    )
}
