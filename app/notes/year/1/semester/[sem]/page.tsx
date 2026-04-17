import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FIRST_YEAR_GROUPS, GroupKey, DEPT_TO_GROUP, DeptKey } from '@/app/lib/data/subjects'

const GROUP_COLORS: Record<GroupKey, { color: string; border: string; accent: string }> = {
    A: { color: 'from-blue-500/20 to-cyan-500/10', border: 'border-blue-500/20', accent: 'text-blue-400' },
    B: { color: 'from-yellow-500/20 to-amber-500/10', border: 'border-yellow-500/20', accent: 'text-yellow-400' },
    C: { color: 'from-orange-500/20 to-red-500/10', border: 'border-orange-500/20', accent: 'text-orange-400' },
    D: { color: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/20', accent: 'text-green-400' },
}

const VALID_SEMS = ['S1', 'S2']

export default async function GroupPickerPage({
    params,
}: {
    params: Promise<{ sem: string }>
}) {
    const { sem } = await params
    if (!VALID_SEMS.includes(sem)) notFound()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('department, role')
        .eq('id', user?.id)
        .single()

    const userDept = profile?.department?.toUpperCase() as DeptKey | undefined
    const isPrivileged = profile?.role === 'exec' || profile?.role === 'core' || profile?.role === 'admin'
    const assignedGroup = userDept ? DEPT_TO_GROUP[userDept] : null

    const allGroups = Object.entries(FIRST_YEAR_GROUPS) as [GroupKey, typeof FIRST_YEAR_GROUPS[GroupKey]][]
    const groups = allGroups.filter(([key]) => {
        if (isPrivileged || !assignedGroup) return true
        return key === assignedGroup
    })

    return (
        <div className="min-h-screen p-4 md:p-8 pt-20 md:pt-32 text-[#ededed]">
            <div className="max-w-6xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 flex-wrap mb-12 text-sm font-bold">
                    <Link href="/notes" className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">Notes</Link>
                    <span className="text-gray-700">/</span>
                    <Link href="/notes/year/1" className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">1st Year</Link>
                    <span className="text-gray-700">/</span>
                    <span className="text-green-400 uppercase tracking-widest">{sem}</span>
                </div>

                {/* Header */}
                <div className="mb-12 space-y-2">
                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-blue-500 inline-block" />
                        1st Year · {sem}
                    </p>
                    <h1 className="text-5xl font-black tracking-tighter text-white">Select Your Group</h1>
                    <p className="text-gray-500 text-lg">Choose the stream group that matches your department</p>
                </div>

                {/* Group Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                    {groups.map(([key, group]) => {
                        const style = GROUP_COLORS[key]
                        return (
                            <Link
                                key={key}
                                href={`/notes/year/1/group/${key}/${sem}`}
                                className={`glass-card group bg-gradient-to-br ${style.color} border ${style.border} hover:scale-[1.02] transition-all block`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl grayscale group-hover:grayscale-0 transition-all">
                                        {group.emoji}
                                    </div>
                                    <span className={`text-[10px] font-black tracking-widest uppercase ${style.accent} border ${style.border} px-3 py-1 rounded-full glass`}>
                                        Group {key}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-black text-white group-hover:text-glow transition-all mb-1 tracking-tighter">{group.label}</h2>
                                <p className={`text-sm font-bold mb-2 ${style.accent}`}>{group.streams}</p>
                                <p className="text-gray-500 text-sm font-medium mb-6">Click to view subjects for {sem}</p>
                                <div className={`flex items-center gap-2 ${style.accent} text-xs font-black uppercase tracking-widest`}>
                                    <span>View Subjects</span>
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
