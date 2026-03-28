import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DEPARTMENTS, DeptKey } from '@/app/lib/data/subjects'

const YEAR_META: Record<number, { label: string; color: string; border: string; accent: string }> = {
    2: { label: '2nd Year', color: 'from-blue-500/20 to-cyan-500/10', border: 'border-blue-500/20', accent: 'text-blue-400' },
    3: { label: '3rd Year', color: 'from-purple-500/20 to-violet-500/10', border: 'border-purple-500/20', accent: 'text-purple-400' },
    4: { label: '4th Year', color: 'from-orange-500/20 to-amber-500/10', border: 'border-orange-500/20', accent: 'text-orange-400' },
}

const DEPT_COLORS: Record<DeptKey, { color: string; border: string; accent: string }> = {
    CSE: { color: 'from-blue-500/20 to-cyan-500/10', border: 'border-blue-500/20', accent: 'text-blue-400' },
    ECE: { color: 'from-cyan-500/20 to-sky-500/10', border: 'border-cyan-500/20', accent: 'text-cyan-400' },
    ME:  { color: 'from-orange-500/20 to-amber-500/10', border: 'border-orange-500/20', accent: 'text-orange-400' },
    MEA: { color: 'from-red-500/20 to-rose-500/10', border: 'border-red-500/20', accent: 'text-red-400' },
    BT:  { color: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/20', accent: 'text-green-400' },
}

const VALID_SEMS: Record<number, string[]> = {
    2: ['S3', 'S4'],
    3: ['S5', 'S6'],
    4: ['S7', 'S8'],
}

export default async function DeptPickerPage({
    params,
}: {
    params: Promise<{ year: string; sem: string }>
}) {
    const { year, sem } = await params
    const yearNum = parseInt(year)
    if (![2, 3, 4].includes(yearNum) || !VALID_SEMS[yearNum].includes(sem.toUpperCase())) notFound()

    const semKey = sem.toUpperCase()
    const yearMeta = YEAR_META[yearNum]
    const deptList = (Object.entries(DEPARTMENTS) as [DeptKey, typeof DEPARTMENTS[DeptKey]][])

    return (
        <div className="min-h-screen p-8 pt-32 text-[#ededed]">
            <div className="max-w-6xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 flex-wrap mb-12 text-sm font-bold">
                    <Link href="/notes" className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">Notes</Link>
                    <span className="text-gray-700">/</span>
                    <Link href={`/notes/year/${yearNum}`} className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">{yearMeta.label}</Link>
                    <span className="text-gray-700">/</span>
                    <span className={`${yearMeta.accent} uppercase tracking-widest`}>{semKey}</span>
                </div>

                {/* Header */}
                <div className="mb-12 space-y-2">
                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-blue-500 inline-block" />
                        {yearMeta.label} · {semKey}
                    </p>
                    <h1 className="text-5xl font-black tracking-tighter text-white">Select Department</h1>
                    <p className="text-gray-500 text-lg">Choose your stream to view subjects and notes</p>
                </div>

                {/* Department Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deptList.map(([code, dept]) => {
                        const style = DEPT_COLORS[code]
                        return (
                            <Link
                                key={code}
                                href={`/notes/year/${yearNum}/dept/${code}/${semKey}`}
                                className={`glass-card group bg-gradient-to-br ${style.color} border ${style.border} hover:scale-[1.02] transition-all block`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl grayscale group-hover:grayscale-0 transition-all">
                                        {dept.emoji}
                                    </div>
                                    <span className={`text-[10px] font-black tracking-widest uppercase ${style.accent} glass border ${style.border} px-3 py-1 rounded-full`}>
                                        {code}
                                    </span>
                                </div>
                                <h2 className="text-xl font-black text-white group-hover:text-glow transition-all mb-1 tracking-tight leading-snug">{dept.name}</h2>
                                <p className="text-gray-500 text-sm font-medium mb-6">View {semKey} subjects &amp; notes</p>
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
