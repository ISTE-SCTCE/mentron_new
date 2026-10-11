import { createClient } from '@/app/lib/supabase/server'
import { TeamGrid } from './TeamGrid'

export default async function TeamPage() {
    const supabase = await createClient()

    // Fetch all leadership members (exec and core)
    const { data: members, error } = await supabase
        .from('profiles')
        .select('full_name, department, role, xp, roll_number')
        .in('role', ['exec', 'core'])
        .order('xp', { ascending: false })

    const maxXp = members?.reduce((max, m) => Math.max(max, m.xp || 0), 1) ?? 1

    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8 pt-20 md:pt-32 text-[#ededed]">
            <div className="max-w-[1800px] mx-auto">
                <header className="flex justify-between items-center mb-10 sm:mb-16">
                    <div className="flex items-center gap-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black tracking-[0.3em] text-cyan-400 uppercase">Leadership</p>
                            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-white">The EXECOM</h1>
                            <p className="text-gray-400 text-xs sm:text-sm font-medium">The team powering technical excellence and student initiatives.</p>
                        </div>
                    </div>
                </header>

                {error && (
                    <div className="p-6 sm:p-8 glass bg-red-500/5 border-red-500/20 text-red-400 rounded-3xl text-sm font-bold uppercase tracking-widest text-center">
                        Failed to load team data. Please try again later.
                    </div>
                )}

                {/* Animated grid — client component handles framer-motion */}
                <TeamGrid members={members ?? []} maxXp={maxXp} />

                <div className="mt-16 sm:mt-24 p-6 sm:p-12 md:p-16 glass rounded-3xl sm:rounded-[3rem] text-center space-y-6 sm:space-y-8 bg-purple-500/5 border-purple-500/20 shadow-[0_0_50px_rgba(112,0,223,0.1)]">
                    <h2 className="text-2xl sm:text-4xl font-black tracking-tighter text-white uppercase italic">Built by Students, <br />for Students.</h2>
                    <p className="text-gray-300 text-sm sm:text-base max-w-xl mx-auto font-medium leading-relaxed">
                        The Executive Committee is dedicated to fostering a culture of innovation and excellence within SCTCE. Connect with us to start your journey.
                    </p>
                </div>
            </div>
        </div>
    )
}
