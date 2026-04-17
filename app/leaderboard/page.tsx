import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import { logout } from '@/app/login/actions'

export default async function LeaderboardPage() {
    const supabase = await createClient()

    // 1. Fetch top students by XP
    const { data: students, error } = await supabase
        .from('profiles')
        .select('full_name, xp, roll_number, department')
        .order('xp', { ascending: false })
        .limit(10)

    return (
        <div className="min-h-screen p-4 md:p-8 pt-20 md:pt-32 text-[#ededed]">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-16">
                    <div className="flex items-center gap-8">
                        <Link href="/dashboard" className="text-gray-500 hover:text-white transition-all text-sm font-bold uppercase tracking-widest">
                            ← Dashboard
                        </Link>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">Gamification</p>
                            <h1 className="text-5xl font-black tracking-tighter text-white">Leaderboard</h1>
                        </div>
                    </div>
                    <form action={logout}>
                        <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-2.5 rounded-full text-xs font-black tracking-widest uppercase transition-all border border-red-500/20">
                            Logout
                        </button>
                    </form>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Top 3 Spooky Podiums */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        {students && students.slice(0, 3).map((student, index) => (
                            <div
                                key={index}
                                className={`glass p-10 rounded-[3rem] text-center border-t-4 ${index === 0 ? 'border-blue-500 scale-110 relative z-10 shadow-[0_0_50px_rgba(59,130,246,0.3)]' :
                                    index === 1 ? 'border-purple-500 mt-4' : 'border-emerald-500 mt-8'
                                    }`}
                            >
                                <div className="text-4xl mb-4">{index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}</div>
                                <h2 className="text-2xl font-black text-white mb-2">{student.full_name}</h2>
                                <p className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase mb-6">{student.department || 'Elite Member'}</p>
                                <div className="text-4xl font-black text-white text-glow">
                                    {student.xp || 0} <span className="text-xs uppercase tracking-widest text-blue-400">XP</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Rankings Table */}
                    <div className="lg:col-span-3 glass rounded-[3rem] overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="p-8 text-[10px] font-black tracking-widest text-gray-500 uppercase">Rank</th>
                                    <th className="p-8 text-[10px] font-black tracking-widest text-gray-500 uppercase">Student</th>
                                    <th className="p-8 text-[10px] font-black tracking-widest text-gray-500 uppercase text-right">Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students && students.map((student, index) => (
                                    <tr
                                        key={index}
                                        className="group hover:bg-white/5 transition-all border-b border-white/5 last:border-0"
                                    >
                                        <td className="p-8">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${index < 3 ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-500'
                                                }`}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold group-hover:text-blue-400 transition-colors">{student.full_name}</span>
                                                <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">{student.roll_number}</span>
                                            </div>
                                        </td>
                                        <td className="p-8 text-right">
                                            <span className="text-xl font-black text-white text-glow">{student.xp || 0}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
