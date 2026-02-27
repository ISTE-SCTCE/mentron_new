'use client'

import { useLoading } from '@/app/lib/context/LoadingContext'

interface RouteConfig {
    icon: string
    label: string
    sub: string
    color: string   // Tailwind gradient class tail
    glow: string    // rgba glow color
}

const ROUTE_MAP: Record<string, RouteConfig> = {
    '/dashboard': { icon: '⊞', label: 'Dashboard', sub: 'System Overview', color: 'from-blue-600 to-blue-400', glow: 'rgba(59,130,246,0.3)' },
    '/analytics': { icon: '📊', label: 'Analytics', sub: 'Performance Metrics', color: 'from-indigo-600 to-blue-400', glow: 'rgba(99,102,241,0.3)' },
    '/notes': { icon: '📚', label: 'Notes', sub: 'Academic Resources', color: 'from-emerald-600 to-teal-400', glow: 'rgba(16,185,129,0.3)' },
    '/events': { icon: '⚡', label: 'Events', sub: 'Upcoming Activities', color: 'from-purple-600 to-violet-400', glow: 'rgba(139,92,246,0.3)' },
    '/marketplace': { icon: '🛍️', label: 'Marketplace', sub: 'Trade Hub', color: 'from-amber-600 to-yellow-400', glow: 'rgba(245,158,11,0.3)' },
    '/projects': { icon: '🧪', label: 'Projects', sub: 'Innovation Lab', color: 'from-cyan-600 to-sky-400', glow: 'rgba(6,182,212,0.3)' },
    '/leaderboard': { icon: '👑', label: 'Leaderboard', sub: 'Top Contributors', color: 'from-yellow-500 to-amber-400', glow: 'rgba(234,179,8,0.3)' },
    '/gallery': { icon: '📸', label: 'Gallery', sub: 'Memories', color: 'from-pink-600 to-rose-400', glow: 'rgba(236,72,153,0.3)' },
    '/team': { icon: '👥', label: 'Team', sub: 'The Executive Committee', color: 'from-slate-600 to-gray-400', glow: 'rgba(148,163,184,0.3)' },
    '/societies': { icon: '🧬', label: 'Societies', sub: 'Chapters & Clubs', color: 'from-rose-600 to-pink-400', glow: 'rgba(244,63,94,0.3)' },
    '/signup': { icon: '✨', label: 'Sign Up', sub: 'Create Account', color: 'from-blue-600 to-blue-400', glow: 'rgba(59,130,246,0.3)' },
    '/login': { icon: '🔑', label: 'Login', sub: 'Access Portal', color: 'from-blue-600 to-blue-400', glow: 'rgba(59,130,246,0.3)' },
}

const DEFAULT_CONFIG: RouteConfig = {
    icon: 'M',
    label: 'Mentron',
    sub: 'Loading…',
    color: 'from-blue-600 to-blue-400',
    glow: 'rgba(59,130,246,0.25)',
}

function getConfig(destination: string | null): RouteConfig {
    if (!destination) return DEFAULT_CONFIG
    // Match longest prefix
    const match = Object.keys(ROUTE_MAP)
        .filter(k => destination === k || destination.startsWith(k + '/'))
        .sort((a, b) => b.length - a.length)[0]
    return ROUTE_MAP[match] ?? DEFAULT_CONFIG
}

export function LoadingOverlay() {
    const { isLoading, destination } = useLoading()
    const cfg = getConfig(destination)

    return (
        <div
            aria-hidden={!isLoading}
            role="status"
            aria-label="Loading"
            className={`
                fixed inset-0 z-[9999] flex flex-col items-center justify-center
                transition-opacity duration-300 ease-in-out
                ${isLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
            `}
            style={{ background: 'rgba(3,3,15,0.88)', backdropFilter: 'blur(16px)' }}
        >
            {/* Ambient glow blob */}
            <div
                className="absolute w-64 h-64 rounded-full blur-3xl opacity-30 loading-blob"
                style={{ background: cfg.glow }}
            />

            {/* Icon card with pulse ring */}
            <div className="relative mb-8">
                {/* Pulse rings */}
                <span className="absolute inset-0 rounded-3xl loading-ring" style={{ boxShadow: `0 0 0 0 ${cfg.glow}` }} />
                <div
                    className={`relative w-20 h-20 rounded-3xl flex items-center justify-center text-3xl
                        bg-gradient-to-br ${cfg.color} shadow-2xl loading-icon-bounce`}
                >
                    {cfg.icon}
                </div>
            </div>

            {/* Route label */}
            <h2 className="text-2xl font-black tracking-tight text-white mb-1 loading-fade-up">
                {cfg.label}
            </h2>
            <p className="text-[11px] font-black tracking-[0.3em] text-gray-500 uppercase mb-10 loading-fade-up-delay">
                {cfg.sub}
            </p>

            {/* Animated bar */}
            <div className="relative w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r ${cfg.color} rounded-full ${isLoading ? 'loading-bar' : ''}`}
                />
            </div>
        </div>
    )
}
