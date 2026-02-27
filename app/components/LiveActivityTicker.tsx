'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TickerItem {
    id: string
    title: string
    type: 'project' | 'marketplace'
    tag: string
    author: string
}

export function LiveActivityTicker({ items, type, title }: { items: any[], type: 'project' | 'marketplace', title: string }) {
    const [feed, setFeed] = useState<TickerItem[]>([])

    useEffect(() => {
        const slice = items.slice(0, 10).map(item => ({
            id: item.id,
            title: item.title,
            type: type,
            tag: type === 'project' ? (item.status || 'ACTIVE') : `₹${item.price || 0}`,
            author: item.profiles?.full_name || 'Anonymous'
        }))
        setFeed(slice)
    }, [items, type])

    const displayFeed = [...feed, ...feed, ...feed]
    if (feed.length === 0) return null

    const isProject = type === 'project'

    return (
        <div className="w-full h-96 hidden xl:flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center gap-2 px-1">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ background: isProject ? '#3B82F6' : '#A855F7' }} />
                    <span className="relative inline-flex rounded-full h-2 w-2"
                        style={{ background: isProject ? '#60A5FA' : '#C084FC' }} />
                </span>
                <p className="text-[9px] font-black tracking-[0.35em] uppercase"
                    style={{ color: isProject ? '#60A5FA' : '#C084FC' }}>
                    Live {title}
                </p>
                <div className="flex-1 h-[1px]"
                    style={{
                        background: isProject
                            ? 'linear-gradient(90deg, rgba(59,130,246,0.4), transparent)'
                            : 'linear-gradient(90deg, rgba(168,85,247,0.4), transparent)'
                    }} />
            </div>

            {/* Feed container — Liquid Glass panel */}
            <div className="relative flex-1 overflow-hidden rounded-[2rem]"
                style={{
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: isProject
                        ? '0 0 40px rgba(59,130,246,0.05), inset 0 1px 0 rgba(255,255,255,0.08)'
                        : '0 0 40px rgba(168,85,247,0.05), inset 0 1px 0 rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(20px)',
                }}>

                {/* Top specular sheen */}
                <div className="absolute top-0 left-0 right-0 h-8 rounded-t-[2rem] pointer-events-none z-10"
                    style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.07), transparent)' }} />

                {/* Top fade mask */}
                <div className="absolute top-0 inset-x-0 h-20 pointer-events-none z-10"
                    style={{ background: 'linear-gradient(to bottom, rgba(8,11,20,0.9), transparent)' }} />
                {/* Bottom fade mask */}
                <div className="absolute bottom-0 inset-x-0 h-20 pointer-events-none z-10"
                    style={{ background: 'linear-gradient(to top, rgba(8,11,20,0.9), transparent)' }} />

                {/* Scrolling feed */}
                <div className="absolute inset-x-3 top-3 flex flex-col gap-3 animate-live-scroll hover:[animation-play-state:paused] pb-3">
                    {displayFeed.map((item, i) => (
                        <Link
                            key={`${item.id}-${i}`}
                            href={isProject ? '/projects' : '/marketplace'}
                            className="group block relative overflow-hidden shrink-0 rounded-2xl p-4 transition-all duration-300"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                            }}
                        >
                            {/* Card hover glow */}
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                style={{
                                    background: isProject
                                        ? 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 70%)'
                                        : 'radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.12) 0%, transparent 70%)'
                                }} />

                            {/* Card top sheen */}
                            <div className="absolute top-0 left-0 right-0 h-5 rounded-t-2xl pointer-events-none"
                                style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.07), transparent)' }} />

                            {/* Header row */}
                            <div className="flex items-center gap-2 mb-2.5">
                                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-base shrink-0"
                                    style={{
                                        background: isProject ? 'rgba(59,130,246,0.15)' : 'rgba(168,85,247,0.15)',
                                        border: `1px solid ${isProject ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)'}`,
                                    }}>
                                    {isProject ? '🚀' : '🛍️'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 truncate">
                                        {item.author}
                                    </p>
                                    <p className="text-[8px] font-black uppercase tracking-[0.15em] truncate"
                                        style={{ color: isProject ? '#60A5FA' : '#C084FC' }}>
                                        New {title}
                                    </p>
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-white font-black text-[11px] leading-snug mb-2.5 line-clamp-2">
                                {item.title}
                            </h3>

                            {/* Footer */}
                            <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider"
                                    style={{
                                        background: isProject ? 'rgba(59,130,246,0.12)' : 'rgba(168,85,247,0.12)',
                                        border: `1px solid ${isProject ? 'rgba(59,130,246,0.25)' : 'rgba(168,85,247,0.25)'}`,
                                        color: isProject ? '#93C5FD' : '#D8B4FE',
                                    }}>
                                    {item.tag}
                                </span>
                                <span className="text-gray-600 group-hover:text-white text-xs transition-colors">↗</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes live-scroll {
                    0%   { transform: translateY(0); }
                    100% { transform: translateY(calc(-33.33% - 0.375rem)); }
                }
                .animate-live-scroll {
                    animation: live-scroll 28s linear infinite;
                }
            `}</style>
        </div>
    )
}
