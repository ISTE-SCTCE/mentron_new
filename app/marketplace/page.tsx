import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MarketplacePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">

            {/* Blurred background — blurred item cards as ghost content */}
            <div className="absolute inset-0 z-0 pointer-events-none select-none" aria-hidden="true">
                {/* Fake blurred cards grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-12 pt-20 md:pt-32 opacity-30 blur-md scale-105">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="glass-card h-56 flex flex-col gap-3 animate-pulse">
                            <div className="w-full h-28 rounded-xl bg-white/5" />
                            <div className="h-3 w-3/4 bg-white/10 rounded-full" />
                            <div className="h-3 w-1/2 bg-white/5 rounded-full" />
                            <div className="h-3 w-1/4 bg-purple-500/20 rounded-full" />
                        </div>
                    ))}
                </div>
                {/* Extra overlay gradient to deepen the blur */}
                <div className="absolute inset-0 bg-[#030305]/60 backdrop-blur-sm" />
            </div>

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
    )
}
