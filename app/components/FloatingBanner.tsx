'use client'

import Link from 'next/link'

export function FloatingBanner() {
    return (
        <div className="mt-12 mb-8 relative w-full overflow-hidden rounded-[2.5rem] group"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
                backdropFilter: 'blur(24px)',
                minHeight: '180px'
            }}>

            {/* Animated Ambient Glows */}
            <div className="absolute -top-[100px] -left-[100px] w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[80px] group-hover:bg-blue-400/30 transition-colors duration-700" />
            <div className="absolute -bottom-[100px] -right-[100px] w-[300px] h-[300px] bg-purple-500/20 rounded-full blur-[80px] group-hover:bg-purple-400/30 transition-colors duration-700" />

            {/* Specular Top Sheen (Apple Liquid Glass) */}
            <div className="absolute top-0 left-0 right-0 h-10 rounded-t-[2.5rem] pointer-events-none"
                style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)' }} />

            {/* Glass Edge Bottom Highlight */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 h-full">

                {/* Left Side: Content */}
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-cyan-400" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                        </span>
                        <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-cyan-400">
                            Community Challenge
                        </h3>
                    </div>

                    <h2 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-white mb-3"
                        style={{ filter: 'drop-shadow(0 2px 10px rgba(255,255,255,0.3))' }}>
                        Climb the Leaderboard
                    </h2>

                    <p className="text-gray-400 text-sm max-w-xl font-medium leading-relaxed">
                        Upload your study materials or share your latest open-source project. Top contributors get featured next week and earn exclusive server roles.
                    </p>
                </div>

                {/* Right Side: CTA Button */}
                <div className="shrink-0">
                    <Link href="/projects"
                        className="relative group/btn inline-flex items-center justify-center overflow-hidden rounded-2xl bg-white/5 p-1 transition-all hover:bg-white/10">
                        {/* Button Glow aura */}
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/40 to-blue-500/40 opacity-0 group-hover/btn:opacity-100 blur transition-opacity duration-300" />

                        <div className="relative flex items-center gap-3 rounded-xl bg-black/40 px-8 py-4 backdrop-blur-md border border-white/10 transition-transform group-hover/btn:scale-[0.98]">
                            <span className="text-sm font-black text-white uppercase tracking-widest">
                                Start Contributing
                            </span>
                            <span className="text-cyan-400 font-bold group-hover/btn:translate-x-1 transition-transform">
                                →
                            </span>
                        </div>
                    </Link>
                </div>

            </div>

            {/* Scanning Laser Effect (Cyberpunk touch) */}
            <div className="absolute top-0 bottom-0 left-[-100%] w-[50%] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-30deg] animate-[shimmer_8s_infinite] pointer-events-none" />
            <style>{`
                @keyframes shimmer {
                    0% { left: -100%; opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { left: 200%; opacity: 0; }
                }
            `}</style>
        </div>
    )
}
