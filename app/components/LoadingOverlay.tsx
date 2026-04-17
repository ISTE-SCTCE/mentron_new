'use client'

import { useLoading } from '@/app/lib/context/LoadingContext'

interface RouteConfig {
    label: string
    sub: string
    ballColor: string
    shadowColor: string
    glowColor: string
}

const ROUTE_MAP: Record<string, RouteConfig> = {
    '/dashboard':   { label: 'Dashboard',   sub: 'System Overview',      ballColor: '#6366f1', shadowColor: 'rgba(99,102,241,0.4)',   glowColor: 'rgba(99,102,241,0.15)' },
    '/analytics':   { label: 'Analytics',   sub: 'Performance Metrics',  ballColor: '#818cf8', shadowColor: 'rgba(129,140,248,0.4)',  glowColor: 'rgba(129,140,248,0.15)' },
    '/notes':       { label: 'Notes',       sub: 'Academic Resources',   ballColor: '#34d399', shadowColor: 'rgba(52,211,153,0.4)',   glowColor: 'rgba(52,211,153,0.12)' },
    '/events':      { label: 'Events',      sub: 'Upcoming Activities',  ballColor: '#a78bfa', shadowColor: 'rgba(167,139,250,0.4)',  glowColor: 'rgba(167,139,250,0.12)' },
    '/marketplace': { label: 'Marketplace', sub: 'Trade Hub',            ballColor: '#fbbf24', shadowColor: 'rgba(251,191,36,0.4)',   glowColor: 'rgba(251,191,36,0.10)' },
    '/projects':    { label: 'Projects',    sub: 'Innovation Lab',       ballColor: '#22d3ee', shadowColor: 'rgba(34,211,238,0.4)',   glowColor: 'rgba(34,211,238,0.12)' },
    '/leaderboard': { label: 'Leaderboard', sub: 'Top Contributors',     ballColor: '#facc15', shadowColor: 'rgba(250,204,21,0.4)',   glowColor: 'rgba(250,204,21,0.10)' },
    '/societies':   { label: 'Societies',   sub: 'Chapters & Clubs',     ballColor: '#f472b6', shadowColor: 'rgba(244,114,182,0.4)',  glowColor: 'rgba(244,114,182,0.12)' },
    '/team':        { label: 'Team',        sub: 'Executive Committee',  ballColor: '#94a3b8', shadowColor: 'rgba(148,163,184,0.4)',  glowColor: 'rgba(148,163,184,0.10)' },
    '/settings':    { label: 'Settings',    sub: 'Preferences',          ballColor: '#7000df', shadowColor: 'rgba(112,0,223,0.4)',   glowColor: 'rgba(112,0,223,0.12)' },
}

const DEFAULT_CONFIG: RouteConfig = {
    label: 'Mentron',
    sub: 'Loading…',
    ballColor: '#7000df',
    shadowColor: 'rgba(112,0,223,0.45)',
    glowColor: 'rgba(112,0,223,0.15)',
}

function getConfig(destination: string | null): RouteConfig {
    if (!destination) return DEFAULT_CONFIG
    const match = Object.keys(ROUTE_MAP)
        .filter(k => destination === k || destination.startsWith(k + '/'))
        .sort((a, b) => b.length - a.length)[0]
    return ROUTE_MAP[match] ?? DEFAULT_CONFIG
}

export function LoadingOverlay() {
    const { isLoading, destination } = useLoading()
    const cfg = getConfig(destination)

    return (
        <>
            <style>{`
                @keyframes mentron-bounce {
                    0% {
                        top: 60px;
                        height: 5px;
                        border-radius: 50px 50px 25px 25px;
                        transform: scaleX(1.7);
                    }
                    40% {
                        height: 20px;
                        border-radius: 50%;
                        transform: scaleX(1);
                    }
                    100% {
                        top: 0%;
                        height: 20px;
                        border-radius: 50%;
                        transform: scaleX(1);
                    }
                }

                @keyframes mentron-shadow {
                    0%   { transform: scaleX(1.5); opacity: 0.8; }
                    100% { transform: scaleX(0.2); opacity: 0.25; }
                }

                @keyframes mentron-fade-in {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                .mball {
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    animation: mentron-bounce 0.5s alternate infinite ease;
                }

                .mball:nth-child(2) { animation-delay: 0.15s; left: 80px; }
                .mball:nth-child(3) { animation-delay: 0.3s;  left: 160px; }

                .mshadow {
                    position: absolute;
                    top: 62px;
                    width: 20px;
                    height: 4px;
                    border-radius: 50%;
                    animation: mentron-shadow 0.5s alternate infinite ease;
                }

                .mshadow:nth-child(5) { animation-delay: 0.15s; left: 80px; }
                .mshadow:nth-child(6) { animation-delay: 0.3s;  left: 160px; }

                .mentron-label-in {
                    animation: mentron-fade-in 0.4s ease both;
                }
                .mentron-label-in-delay {
                    animation: mentron-fade-in 0.4s ease 0.1s both;
                }
            `}</style>

            <div
                aria-hidden={!isLoading}
                role="status"
                aria-label="Loading"
                className={`
                    fixed inset-0 z-[9999] flex flex-col items-center justify-center
                    transition-opacity duration-300 ease-in-out
                    ${isLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                `}
                style={{ background: 'rgba(3,3,15,0.92)', backdropFilter: 'blur(18px)' }}
            >
                {/* Ambient glow */}
                <div
                    className="absolute w-72 h-72 rounded-full pointer-events-none"
                    style={{
                        background: `radial-gradient(circle, ${cfg.glowColor} 0%, transparent 70%)`,
                        filter: 'blur(40px)',
                        animation: 'mentron-fade-in 0.6s ease both'
                    }}
                />

                {/* ── Bouncing Balls Rig ── */}
                <div style={{ position: 'relative', width: '180px', height: '68px', marginBottom: '40px' }}>
                    {/* Balls */}
                    <div className="mball" style={{ left: 0,     top: 60, background: cfg.ballColor, boxShadow: `0 0 12px 2px ${cfg.glowColor}` }} />
                    <div className="mball" style={{ left: '80px', top: 60, background: cfg.ballColor, boxShadow: `0 0 12px 2px ${cfg.glowColor}` }} />
                    <div className="mball" style={{ left: '160px', top: 60, background: cfg.ballColor, boxShadow: `0 0 12px 2px ${cfg.glowColor}` }} />

                    {/* Shadows */}
                    <div className="mshadow" style={{ left: 0,      background: cfg.shadowColor, filter: 'blur(2px)' }} />
                    <div className="mshadow" style={{ left: '80px',  background: cfg.shadowColor, filter: 'blur(2px)' }} />
                    <div className="mshadow" style={{ left: '160px', background: cfg.shadowColor, filter: 'blur(2px)' }} />
                </div>

                {/* Route label */}
                <h2 className="text-xl font-black tracking-tight text-white mb-1 mentron-label-in">
                    {cfg.label}
                </h2>
                <p className="text-[10px] font-black tracking-[0.3em] uppercase mentron-label-in-delay"
                    style={{ color: 'rgba(139,148,168,0.7)' }}>
                    {cfg.sub}
                </p>
            </div>
        </>
    )
}
