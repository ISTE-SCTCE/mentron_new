'use client'

import Link from 'next/link'
import { Settings } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function GlobalSettingsIcon() {
    const pathname = usePathname()

    // Optionally hide on the settings page itself or specific unauthenticated pages
    if (pathname === '/' || pathname === '/login' || pathname === '/signup' || pathname === '/settings') {
        return null
    }

    return (
        <Link
            href="/settings"
            title="Settings"
            className="fixed top-6 right-6 z-[100] group flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 bg-[#050514]/80 backdrop-blur-xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
        >
            <Settings size={22} className="text-gray-400 group-hover:text-cyan-400 group-hover:rotate-90 transition-all duration-500" />

            {/* Hover Glow */}
            <div className="absolute inset-0 rounded-2xl bg-cyan-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </Link>
    )
}
