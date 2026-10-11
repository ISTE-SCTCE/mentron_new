import { createClient } from '@/app/lib/supabase/server'
import { LeaderboardClient } from './LeaderboardClient'

export default async function LeaderboardPage() {
    const supabase = await createClient()

    // 1. Fetch top students by Event Ideas Votes dynamically via View
    const { data: students } = await supabase
        .from('leaderboard_view')
        .select('full_name, roll_number, department, xp')
        .order('xp', { ascending: false })
        .limit(10)

    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8 pt-20 sm:pt-28 md:pt-32 text-[#ededed]">
            <div className="max-w-[1800px] mx-auto">
                <header className="flex justify-between items-center mb-8 sm:mb-12">
                    <div className="flex items-center gap-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black tracking-[0.3em] text-cyan-400 uppercase flex items-center gap-2">
                                <span className="w-8 h-[1px] bg-gradient-to-r from-purple-500 to-cyan-400 inline-block" />
                                Community Influence
                            </p>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white">Event Leaderboard</h1>
                        </div>
                    </div>
                </header>

                {/* Animated leaderboard — client component handles framer-motion & count-up */}
                <LeaderboardClient students={students ?? []} />
            </div>
        </div>
    )
}
