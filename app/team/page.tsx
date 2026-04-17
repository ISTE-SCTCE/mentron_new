import Link from 'next/link'
import { logout } from '@/app/login/actions'
import { createClient } from '@/app/lib/supabase/server'

export default async function TeamPage() {
    const supabase = await createClient()

    // Fetch all leadership members (exec and core)
    const { data: members, error } = await supabase
        .from('profiles')
        .select('full_name, department, role, xp, roll_number')
        .in('role', ['exec', 'core'])
        .order('xp', { ascending: false })

    return (
        <div className="min-h-screen p-4 md:p-8 pt-20 md:pt-32 text-[#ededed]">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-16">
                    <div className="flex items-center gap-8">
                        <Link href="/dashboard" className="text-gray-500 hover:text-white transition-all text-sm font-bold uppercase tracking-widest">
                            ← Dashboard
                        </Link>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">Leadership</p>
                            <h1 className="text-5xl font-black tracking-tighter text-white">The EXECOM</h1>
                        </div>
                    </div>
                    <form action={logout}>
                        <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-2.5 rounded-full text-xs font-black tracking-widest uppercase transition-all border border-red-500/20">
                            Logout
                        </button>
                    </form>
                </header>

                {error && (
                    <div className="p-8 glass bg-red-500/5 border-red-500/20 text-red-500 rounded-3xl text-sm font-bold uppercase tracking-widest text-center">
                        Failed to load team data. Please try again later.
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {members?.map((member, index) => (
                        <div
                            key={index}
                            className="glass glass-hover p-8 rounded-[3rem] text-center group flex flex-col items-center"
                        >
                            <div className="w-32 h-32 rounded-[2rem] overflow-hidden mb-6 border-2 border-white/5 group-hover:border-blue-500/50 transition-all p-2 bg-white/5">
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.full_name}`}
                                    alt={member.full_name}
                                    className="w-full h-full object-cover rounded-[1.5rem]"
                                />
                            </div>
                            <h2 className="text-xl font-black text-white mb-1 group-hover:text-glow transition-all">
                                {member.full_name}
                            </h2>
                            <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                                {member.role === 'core' ? 'Core Member' : 'Executive Member'}
                            </p>
                            <div className="mt-auto space-y-4 w-full">
                                <div className="px-4 py-1.5 glass rounded-full text-[9px] font-black tracking-widest text-gray-500 uppercase">
                                    {(member.department || 'Not Assigned')} DEPARTMENT
                                </div>
                                <div className="text-[10px] font-bold text-blue-400/60 uppercase tracking-[0.3em]">
                                    {member.xp || 0} XP
                                </div>
                            </div>
                        </div>
                    ))}
                    {!error && members?.length === 0 && (
                        <div className="col-span-full py-20 text-center space-y-4">
                            <span className="text-5xl">👥</span>
                            <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.2em]">No executive members found.</p>
                        </div>
                    )}
                </div>

                <div className="mt-24 p-16 glass rounded-[4rem] text-center space-y-8 bg-blue-500/5 border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
                    <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">Built by Students, <br />for Students.</h2>
                    <p className="text-gray-400 max-w-xl mx-auto font-medium leading-relaxed">
                        The Executive Committee is dedicated to fostering a culture of innovation and excellence within SCTCE. Connect with us to start your journey.
                    </p>
                </div>
            </div>
        </div>
    )
}

