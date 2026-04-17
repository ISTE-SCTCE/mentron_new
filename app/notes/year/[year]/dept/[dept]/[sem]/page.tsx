import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import { DEPARTMENTS, DeptKey, SemKey, getSubjects } from '@/app/lib/data/subjects'
import { getDepartmentFromRollNumber } from '@/app/lib/utils/departmentMapper'
import { InteractionTracker } from '@/app/components/InteractionTracker'

const DEPT_COLORS: Record<DeptKey, { color: string; border: string; accent: string }> = {
    CSE: { color: 'from-blue-500/20 to-cyan-500/10', border: 'border-blue-500/20', accent: 'text-blue-400' },
    ECE: { color: 'from-cyan-500/20 to-sky-500/10', border: 'border-cyan-500/20', accent: 'text-cyan-400' },
    ME:  { color: 'from-orange-500/20 to-amber-500/10', border: 'border-orange-500/20', accent: 'text-orange-400' },
    MEA: { color: 'from-red-500/20 to-rose-500/10', border: 'border-red-500/20', accent: 'text-red-400' },
    BT:  { color: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/20', accent: 'text-green-400' },
}

const YEAR_META: Record<number, { label: string; accent: string }> = {
    2: { label: '2nd Year', accent: 'text-blue-400' },
    3: { label: '3rd Year', accent: 'text-purple-400' },
    4: { label: '4th Year', accent: 'text-orange-400' },
}

const VALID_DEPTS = ['CSE', 'ECE', 'ME', 'MEA', 'BT']
const VALID_SEMS  = ['S3', 'S4', 'S5', 'S6', 'S7', 'S8']

export default async function DeptSubjectsPage({
    params,
}: {
    params: Promise<{ year: string; dept: string; sem: string }>
}) {
    const { year, dept, sem } = await params
    const yearNum = parseInt(year)
    const deptKey = dept.toUpperCase() as DeptKey
    const semKey  = sem.toUpperCase() as SemKey

    if (![2, 3, 4].includes(yearNum) || !VALID_DEPTS.includes(deptKey) || !VALID_SEMS.includes(semKey)) {
        notFound()
    }

    const deptMeta = DEPARTMENTS[deptKey]
    const style    = DEPT_COLORS[deptKey]
    const yearMeta = YEAR_META[yearNum]

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, department, roll_number')
        .eq('id', user?.id ?? '')
        .single()

  const isPrivileged = profile?.role === 'exec' || profile?.role === 'core'
    if (!isPrivileged) {
        const detectedDept = getDepartmentFromRollNumber(profile?.roll_number)
        const userDept = (detectedDept !== 'Other' ? detectedDept : profile?.department) ?? ''
        if (userDept && userDept.toUpperCase() !== deptKey) {
            // Show restricted page instead of redirect — keeps breadcrumb intact
            return (
                <div className="min-h-screen p-4 md:p-8 pt-20 md:pt-32 text-[#ededed] flex items-center justify-center">
                    <div className="glass-card max-w-md text-center border-red-500/20 bg-red-500/5">
                        <div className="text-5xl mb-4">🔒</div>
                        <h2 className="text-2xl font-black text-white mb-2">Access Restricted</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            These notes are for <strong className="text-white">{deptKey}</strong> students.
                            Your department is <strong className="text-white">{userDept}</strong>.
                        </p>
                        <Link href={`/notes/year/${yearNum}/semester/${semKey}/${userDept.toUpperCase()}`}
                            className="glass glass-hover px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest text-blue-400 border-blue-500/20">
                            Go to My Department →
                        </Link>
                    </div>
                </div>
            )
        }
    }

    const subjects = getSubjects(deptKey, semKey)

    // Fetch note counts per subject for this sem/dept/year
    const { data: allNotes } = await supabase
        .from('notes')
        .select('id, subject, title, file_url, profiles!notes_profile_id_fkey(full_name)')
        .eq('year', yearNum)
        .ilike('department', `%${deptKey}%`)
        .eq('semester', semKey)
        .order('created_at', { ascending: false })

    const notesBySubject: Record<string, any[]> = {}
    for (const note of (allNotes ?? [])) {
        if (!note.subject) continue
        notesBySubject[note.subject] = notesBySubject[note.subject] ?? []
        notesBySubject[note.subject].push(note)
    }

    const basePath = `/notes/year/${yearNum}/dept/${deptKey}/${semKey}`
    const uploadUrl = `/notes/upload`

    return (
        <div className="min-h-screen p-4 md:p-8 pt-20 md:pt-32 text-[#ededed]">
            <div className="max-w-6xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 flex-wrap mb-12 text-sm font-bold">
                    <Link href="/notes" className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">Notes</Link>
                    <span className="text-gray-700">/</span>
                    <Link href={`/notes/year/${yearNum}`} className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">{yearMeta.label}</Link>
                    <span className="text-gray-700">/</span>
                    <Link href={`/notes/year/${yearNum}/semester/${semKey}`} className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">{semKey}</Link>
                    <span className="text-gray-700">/</span>
                    <span className={`${style.accent} uppercase tracking-widest`}>{deptKey}</span>
                </div>

                {/* Header card */}
                <div className={`glass-card mb-12 bg-gradient-to-br ${style.color} border ${style.border}`}>
                    <div className="flex items-center justify-between gap-6 flex-wrap">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center text-4xl">{deptMeta.emoji}</div>
                            <div>
                                <p className={`text-[10px] font-black tracking-[0.3em] uppercase ${style.accent}`}>{yearMeta.label} · {semKey}</p>
                                <h1 className="text-4xl font-black tracking-tighter text-white mt-1">{deptMeta.name}</h1>
                                <p className={`text-sm font-bold mt-1 ${style.accent}`}>{deptKey}</p>
                            </div>
                        </div>
                        <Link href={uploadUrl} className={`glass glass-hover px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest ${style.accent} border ${style.border}`}>
                            + Contribute Notes
                        </Link>
                    </div>
                </div>

                {/* Subject list — each subject is a card showing note count and links to subject page */}
                <h2 className="text-xs font-black tracking-[0.2em] text-blue-500 uppercase mb-6">
                    Subjects — {semKey}
                </h2>
                <div className="space-y-4">
                    {subjects.length > 0 ? subjects.map((subject, idx) => {
                        const isElective = subject.startsWith('— Electives:')
                        if (isElective) {
                            const electives = subject.replace('— Electives: ', '').split(', ')
                            return (
                                <div key={idx} className="glass p-6 rounded-2xl border border-white/5">
                                    <p className={`text-[10px] font-black tracking-widest uppercase ${style.accent} mb-3`}>Open Electives (choose one)</p>
                                    <div className="flex flex-wrap gap-2">
                                        {electives.map((e, i) => (
                                            <Link
                                                key={i}
                                                href={`${basePath}/${encodeURIComponent(e)}`}
                                                className={`px-3 py-1 glass rounded-full text-xs font-medium border ${style.border} ${style.accent} hover:scale-105 transition-all`}
                                            >
                                                {e}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )
                        }

                        const subjectNotes = notesBySubject[subject] ?? []
                        const noteCount = subjectNotes.length

                        return (
                            <Link
                                key={idx}
                                href={`${basePath}/${encodeURIComponent(subject)}`}
                                className={`glass p-5 rounded-2xl flex items-center gap-4 border border-white/5 hover:border-white/15 group transition-all hover:bg-white/3`}
                            >
                                <span className={`w-8 h-8 shrink-0 rounded-xl ${style.color} border ${style.border} flex items-center justify-center text-[11px] font-black ${style.accent}`}>
                                    {idx + 1}
                                </span>
                                <span className="text-sm text-white font-medium leading-snug flex-1 group-hover:text-glow transition-all">{subject}</span>
                                <div className="flex items-center gap-3 shrink-0">
                                    {noteCount > 0 ? (
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${style.color} border ${style.border} ${style.accent}`}>
                                            {noteCount} note{noteCount !== 1 ? 's' : ''}
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/5 text-gray-600">
                                            No notes
                                        </span>
                                    )}
                                    <span className={`${style.accent} group-hover:translate-x-1 transition-transform`}>→</span>
                                </div>
                            </Link>
                        )
                    }) : (
                        <p className="text-gray-600 text-sm">No subjects data available.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
