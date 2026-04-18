import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SpiderScene } from './SpiderScene'

export default async function MarketplacePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">

            {/* 3D Spider Background */}
            <SpiderScene />
            {/* Overlay gradient to ensure text readability */}
            <div className="absolute inset-0 bg-[#030305]/40 pointer-events-none z-[1]" />

            {/* Coming Soon content */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
                {/* Icon */}
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-5xl mb-8 shadow-[0_0_60px_rgba(112,0,223,0.4)]">
                    🛍️
                </div>

                {/* Labels */}
                <p className="text-[10px] font-black tracking-[0.3em] text-purple-400 uppercase mb-4">
                    Coming Soon
                </p>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-4">
                    Marketplace
                </h1>
                <p className="text-gray-400 font-medium leading-relaxed text-base mb-10">
                    Buy and sell items within the Mentron community. <br className="hidden sm:block" />
                    We&apos;re putting the finishing touches on it — stay tuned!
                </p>

                {/* Feature teasers */}
                <div className="grid grid-cols-3 gap-4 w-full mb-10">
                    {[
                        { icon: '📦', label: 'Buy Items' },
                        { icon: '🏷️', label: 'Sell Stuff' },
                        { icon: '🤝', label: 'Community Deals' },
                    ].map(f => (
                        <div key={f.label} className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
                            <span className="text-2xl">{f.icon}</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{f.label}</span>
                        </div>
                    ))}
                </div>

                {/* Back button */}
                <Link
                    href="/dashboard"
                    className="glass border border-white/10 px-8 py-3 rounded-2xl text-sm font-black text-white uppercase tracking-widest hover:border-purple-500/40 hover:bg-purple-500/10 transition-all"
                >
                    ← Back to Dashboard
                </Link>
            </div>
        </div>
            
            {/* Draggable hint */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-pulse">
                <div className="glass px-6 py-2 rounded-full border border-white/10 flex items-center gap-3 bg-black/20 backdrop-blur-md">
                    <span className="text-sm">👆</span>
                    <span className="text-xs font-black tracking-widest text-white/90 uppercase">
                        Drag to walk the spider
                    </span>
                </div>
            </div>
        </div>
    )
}
