import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import { FIRST_YEAR_GROUPS, GroupKey } from '@/app/lib/data/subjects'
import { getDepartmentFromRollNumber, getGroupFromDepartment } from '@/app/lib/utils/departmentMapper'
import { SubjectFoldersClient } from '@/app/notes/SubjectFoldersClient'
import { SubjectRowClient } from '@/app/notes/SubjectRowClient'

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
                <div className="min-h-screen p-4 md:p-8 pt-20 md:pt-32 text-[#ededed] flex items-center justify-center">
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

    // Fetch custom "root" folders created directly on this subjects tab
    const { data: rootFolders } = await supabase
        .from('note_folders')
        .select('id, name')
        .eq('department', groupKey)
        .eq('year', 1)
        .eq('semester', sem)
        .eq('subject', 'ROOT')
        .order('created_at', { ascending: true })

    const basePath = `/notes/year/1/group/${groupKey}/${sem}`

    return (
        <div className="min-h-screen p-4 md:p-8 pt-20 md:pt-32 text-[#ededed]">
            <div className="max-w-5xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 flex-wrap mb-12 text-sm font-bold">
                    <Link href="/notes" className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">Notes</Link>
                    <span className="text-gray-700">/</span>
                    <Link href="/notes/year/1" className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">1st Year</Link>
                    <span className="text-gray-700">/</span>
                    <Link href={`/notes/year/1/semester/${sem}`} className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">{sem}</Link>
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

                <div className="mb-12">
                    <SubjectFoldersClient
                        subjectName="ROOT"
                        department={groupKey}
                        year="1"
                        semester={sem}
                        initialFolders={[]}
                        canCreateFolder={isPrivileged}
                        styleAccent={style.accent}
                        styleBorder={style.border}
                        yearNum={1}
                        deptKey={groupKey}
                        semKey={sem}
                        isPrivileged={isPrivileged}
                        title="Create Additional Custom Subjects"
                        hideFolderList={true}
                    />
                </div>

                {/* Subject list — each clickable with note count */}
                <h2 className="text-xs font-black tracking-[0.2em] text-blue-500 uppercase mb-6">Subjects — {sem}</h2>
                <div className="space-y-4">
                    {rootFolders && rootFolders.length > 0 ? rootFolders.map((folder, idx) => {
                        const subject = folder.name
                        const subjectNotes = notesBySubject[subject] ?? []
                        const pyqNotes = notesBySubject[`PYQ - ${subject}`] ?? []
                        const videoNotes = notesBySubject[`Video - ${subject}`] ?? []
                        const noteCount = subjectNotes.length + pyqNotes.length + videoNotes.length
                        return (
                            <SubjectRowClient
                                key={idx}
                                id={folder.id}
                                name={folder.name}
                                basePath={basePath}
                                noteCount={noteCount}
                                style={style}
                                idx={idx}
                                isPrivileged={isPrivileged}
                            />
                        )
                    }) : (
                        <div className="text-center p-8 glass rounded-3xl border border-white/5">
                            <h3 className="text-2xl mb-2">📚</h3>
                            <p className="text-gray-400 font-medium">No subjects found.</p>
                            {isPrivileged && <p className="text-xs text-blue-400 mt-2">Run the migration API or create one.</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
