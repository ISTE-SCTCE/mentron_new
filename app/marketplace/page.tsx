import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SpiderScene } from '@/app/components/SpiderScene'

export default async function MarketplacePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-[#f8f9fa] selection:bg-orange-500/30">
            
            {/* Light Mesh Grid Background */}
            <div 
                className="absolute inset-0 opacity-[0.4]" 
                style={{
                    backgroundImage: `linear-gradient(#dee2e6 1px, transparent 1px), linear-gradient(90deg, #dee2e6 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }} 
            />

            {/* Large background text "COMING SOON" */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden">
                <h2 className="text-[20vw] font-black text-[#dee2e6]/50 leading-none tracking-tighter">
                    COMING
                </h2>
                <h2 className="text-[20vw] font-black text-[#dee2e6]/50 leading-none tracking-tighter">
                    SOON
                </h2>
            </div>

            {/* 3D Spider Scene */}
            <SpiderScene />

            {/* Navigation Pinhole (Top Center Pill) */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black rounded-full px-6 py-3 shadow-2xl">
                <span className="text-white text-lg">🧙</span>
                <div className="flex bg-[#111] rounded-full px-1 py-1 ml-4 border border-white/10">
                    <input 
                        type="text" 
                        placeholder="Subscribe" 
                        className="bg-transparent text-white px-4 py-1.5 text-xs outline-none w-32 font-bold"
                    />
                    <button className="bg-white text-black text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter hover:bg-[#eee] transition-colors">
                        Submit
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center text-center px-6">
                {/* Logo from screenshot position */}
                <div className="absolute top-0 left-10 md:left-20 pointer-events-none opacity-80">
                   <div className="text-4xl text-black">🎩</div>
                </div>

                {/* Draggable hint (Small bottom text) */}
                <div className="mt-[60vh] flex flex-col items-center">
                    <p className="text-[10px] font-black tracking-widest text-black/60 uppercase mb-4">
                        Want to learn how to add 3D to your websites?
                    </p>
                    <div className="flex gap-2">
                         <div className="bg-white border border-[#dee2e6] rounded-xl px-4 py-3 min-w-[300px] text-left text-sm text-gray-400">
                            Enter your email
                         </div>
                         <button className="bg-blue-600 text-white rounded-xl px-6 py-3 text-sm font-black flex items-center gap-2 hover:bg-blue-700 transition-colors">
                            <span>🚀</span> Get notified
                         </button>
                    </div>
                </div>

                <Link
                    href="/dashboard"
                    className="mt-12 text-[10px] font-black text-black/40 uppercase tracking-[0.2em] hover:text-blue-600 transition-colors"
                >
                    ← Back to Dashboard
                </Link>
            </div>

            {/* Cursor Hint */}
            <div className="absolute top-1/3 left-1/3 z-[60] pointer-events-none animate-bounce opacity-40">
                <span className="text-4xl text-black">👆</span>
            </div>
        </div>
    )
}

