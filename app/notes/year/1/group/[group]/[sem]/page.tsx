import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import { FIRST_YEAR_GROUPS, getFirstYearSubjects, GroupKey } from '@/app/lib/data/subjects'
import { getDepartmentFromRollNumber, getGroupFromDepartment } from '@/app/lib/utils/departmentMapper'

const VALID_GROUPS: GroupKey[] = ['A', 'B', 'C', 'D']
const VALID_SEMS = ['S1', 'S2']

const GROUP_COLORS: Record<GroupKey, { color: string; border: string; accent: string }> = {
    A: { color: 'from-blue-500/20 to-cyan-500/10', border: 'border-blue-500/20', accent: 'text-blue-400' },
    B: { color: 'from-yellow-500/20 to-amber-500/10', border: 'border-yellow-500/20', accent: 'text-yellow-400' },
    C: { color: 'from-orange-500/20 to-red-500/10', border: 'border-orange-500/20', accent: 'text-orange-400' },
    D: { color: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/20', accent: 'text-green-400' },
}

export default async function Year1SubjectsPage({
    params,
}: {
    params: Promise<{ group: string; sem: string }>
}) {
    const { group, sem } = await params
    const groupKey = group.toUpperCase() as GroupKey
    if (!VALID_GROUPS.includes(groupKey) || !VALID_SEMS.includes(sem)) notFound()

    const groupMeta = FIRST_YEAR_GROUPS[groupKey]
    const style = GROUP_COLORS[groupKey]
    const subjects = getFirstYearSubjects(groupKey, sem as 'S1' | 'S2')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, department, roll_number')
        .eq('id', user?.id ?? '')
        .single()

    // Group-based access control for Year 1 students
    const isPrivileged = profile?.role === 'exec' || profile?.role === 'core'
    if (!isPrivileged) {
        const detectedDept = getDepartmentFromRollNumber(profile?.roll_number)
        const resolvedDept = detectedDept !== 'Other' ? detectedDept : (profile?.department ?? '')
        const userGroup = getGroupFromDepartment(resolvedDept)
        if (userGroup !== groupKey) {
            return (
                <div className="min-h-screen p-8 pt-32 text-[#ededed] flex items-center justify-center">
                    <div className="glass-card max-w-md text-center border-red-500/20 bg-red-500/5">
                        <div className="text-5xl mb-4">🔒</div>
                        <h2 className="text-2xl font-black text-white mb-2">Access Restricted</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            You belong to <strong className="text-white">Group {userGroup}</strong>.
                            Group {groupKey} notes are available only to students in that stream.
                        </p>
                        <Link href={`/notes/year/1/group/${userGroup}/${sem}`}
                            className="glass glass-hover px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest text-blue-400 border-blue-500/20">
                            Go to My Group →
                        </Link>
                    </div>
                </div>
            )
        }
    }

    // Fetch all notes for this group+sem with subject
    const { data: allNotes } = await supabase
        .from('notes')
        .select('id, subject, title, file_url, profile_id, profiles!notes_profile_id_fkey(full_name)')
        .eq('year', 1)
        .eq('department', groupKey)   // For Y1, department stores the group letter
        .eq('semester', sem)
        .order('created_at', { ascending: false })

    const notesBySubject: Record<string, any[]> = {}
    for (const note of (allNotes ?? [])) {
        if (!note.subject) continue
        notesBySubject[note.subject] = notesBySubject[note.subject] ?? []
        notesBySubject[note.subject].push(note)
    }

    const basePath = `/notes/year/1/group/${groupKey}/${sem}`

    return (
        <div className="min-h-screen p-8 pt-32 text-[#ededed]">
            <div className="max-w-5xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 flex-wrap mb-12 text-sm font-bold">
                    <Link href="/notes" className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">Notes</Link>
                    <span className="text-gray-700">/</span>
                    <Link href="/notes/year/1" className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">1st Year</Link>
                    <span className="text-gray-700">/</span>
                    <Link href={`/notes/year/1/group/${sem}`} className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">{sem}</Link>
                    <span className="text-gray-700">/</span>
                    <span className={`${style.accent} uppercase tracking-widest`}>Group {groupKey}</span>
                </div>

                {/* Header */}
                <div className={`glass-card mb-12 bg-gradient-to-br ${style.color} border ${style.border}`}>
                    <div className="flex items-center justify-between gap-6 flex-wrap">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center text-4xl">{groupMeta.emoji}</div>
                            <div>
                                <p className={`text-[10px] font-black tracking-[0.3em] uppercase ${style.accent}`}>1st Year · {sem}</p>
                                <h1 className="text-4xl font-black tracking-tighter text-white mt-1">{groupMeta.label}</h1>
                                <p className={`text-sm font-bold mt-1 ${style.accent}`}>{groupMeta.streams}</p>
                            </div>
                        </div>
                        <Link href="/notes/upload" className={`glass glass-hover px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest ${style.accent} border ${style.border}`}>
                            + Contribute Notes
                        </Link>
                    </div>
                </div>

                {/* Subject list — each clickable with note count */}
                <h2 className="text-xs font-black tracking-[0.2em] text-blue-500 uppercase mb-6">Subjects — {sem}</h2>
                <div className="space-y-4">
                    {subjects.map((subject, idx) => {
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
                    })}
                </div>
            </div>
        </div>
    )
}
