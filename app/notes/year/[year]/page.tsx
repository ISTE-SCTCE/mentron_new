import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DEPARTMENTS, DeptKey, DEPT_TO_GROUP } from '@/app/lib/data/subjects'

const YEAR_META: Record<number, { label: string; emoji: string; color: string; border: string; accent: string }> = {
    1: { label: '1st Year', emoji: '🌱', color: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/20', accent: 'text-green-400' },
    2: { label: '2nd Year', emoji: '📘', color: 'from-blue-500/20 to-cyan-500/10', border: 'border-blue-500/20', accent: 'text-blue-400' },
    3: { label: '3rd Year', emoji: '🔬', color: 'from-purple-500/20 to-violet-500/10', border: 'border-purple-500/20', accent: 'text-purple-400' },
    4: { label: '4th Year', emoji: '🎓', color: 'from-orange-500/20 to-amber-500/10', border: 'border-orange-500/20', accent: 'text-orange-400' },
}

const SEMS: Record<number, { sem: string; label: string }[]> = {
    1: [{ sem: 'S1', label: 'Semester 1' }, { sem: 'S2', label: 'Semester 2' }],
    2: [{ sem: 'S3', label: 'Semester 3' }, { sem: 'S4', label: 'Semester 4' }],
    3: [{ sem: 'S5', label: 'Semester 5' }, { sem: 'S6', label: 'Semester 6' }],
    4: [{ sem: 'S7', label: 'Semester 7' }, { sem: 'S8', label: 'Semester 8' }],
}

export default async function YearPage({
    params,
}: {
    params: Promise<{ year: string }>
}) {
    const { year } = await params
    const yearNum = parseInt(year)
    if (![1, 2, 3, 4].includes(yearNum)) notFound()

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

    const meta = YEAR_META[yearNum]
    const sems = SEMS[yearNum]
    const deptList = (Object.entries(DEPARTMENTS) as [DeptKey, typeof DEPARTMENTS[DeptKey]][])

    return (
        <div className="min-h-screen p-8 pt-32 text-[#ededed]">
            <div className="max-w-6xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-3 mb-12 text-sm font-bold">
                    <Link href="/notes" className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">← Notes</Link>
                    <span className="text-gray-700">/</span>
                    <span className={`${meta.accent} uppercase tracking-widest`}>{meta.label}</span>
                </div>

                {/* Header */}
                <div className="mb-12 space-y-2">
                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-blue-500 inline-block" />
                        {meta.label}
                    </p>
                    <h1 className="text-5xl font-black tracking-tighter text-white flex items-center gap-4">
                        <span>{meta.emoji}</span> Select Semester
                    </h1>
                </div>

                {/* Semester Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10 mb-16">
                    {sems.map(({ sem, label }: { sem: string; label: string }) => {
                        let href = ''
                        if (yearNum === 1) {
                            if (!isPrivileged && assignedGroup) {
                                href = `/notes/year/1/group/${assignedGroup}/${sem}`
                            } else {
                                href = `/notes/year/1/group/${sem}`
                            }
                        } else {
                           href = `/notes/year/${yearNum}/dept/${sem}`
                        }

                        return (
                            <Link
                                key={sem}
                                href={href}
                                className={`glass-card group bg-gradient-to-br ${meta.color} border ${meta.border} hover:scale-[1.02] transition-all block`}
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center text-4xl font-black text-white/30 group-hover:text-white/90 transition-all tracking-tighter">
                                        {sem}
                                    </div>
                                    <span className={`text-[10px] font-black tracking-widest uppercase ${meta.accent}`}>
                                        {meta.label}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-black text-white group-hover:text-glow transition-all mb-2 tracking-tighter">{label}</h2>
                                <p className="text-gray-500 text-sm font-medium mb-6">
                                    {yearNum === 1 ? 'View your group subjects' : 'Select your department'}
                                </p>
                                <div className={`flex items-center gap-2 ${meta.accent} text-xs font-black uppercase tracking-widest`}>
                                    <span>{yearNum === 1 ? 'View Group' : 'Choose Department'}</span>
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </Link>
                        )
                    })}
                </div>

                {/* For years 2-4: also show dept overview below semester cards */}
                {yearNum > 1 && (
                    <div>
                        <div className="mb-6">
                            <p className="text-[10px] font-black tracking-[0.3em] text-gray-600 uppercase">Available Departments</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {deptList.map(([code, dept]) => (
                                <div key={code} className="glass p-4 rounded-2xl text-center border border-white/5">
                                    <div className="text-2xl mb-2">{dept.emoji}</div>
                                    <p className="text-xs font-black text-white">{code}</p>
                                    <p className="text-[9px] text-gray-500 mt-1">{dept.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
