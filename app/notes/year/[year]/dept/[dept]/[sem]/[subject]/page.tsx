import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import { DEPARTMENTS, DeptKey, SemKey, getSubjects } from '@/app/lib/data/subjects'
import { InteractionTracker } from '@/app/components/InteractionTracker'
import { DeleteButton } from '@/app/components/DeleteButton'
import { deleteNote } from '@/app/lib/actions/deleteActions'

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
const VALID_SEMS = ['S3', 'S4', 'S5', 'S6', 'S7', 'S8']

export default async function SubjectNotesPage({
    params,
}: {
    params: Promise<{ year: string; dept: string; sem: string; subject: string }>
}) {
    const { year, dept, sem, subject } = await params
    const yearNum = parseInt(year)
    const deptKey = dept.toUpperCase() as DeptKey
    const semKey = sem.toUpperCase() as SemKey
    const subjectName = decodeURIComponent(subject)

    if (![2, 3, 4].includes(yearNum) || !VALID_DEPTS.includes(deptKey) || !VALID_SEMS.includes(semKey)) {
        notFound()
    }

    const deptMeta = DEPARTMENTS[deptKey]
    const style = DEPT_COLORS[deptKey]
    const yearMeta = YEAR_META[yearNum]

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, department')
        .eq('id', user?.id ?? '')
        .single()

    // Fetch notes filtered by year + dept + semester + subject
    const { data: notes } = await supabase
        .from('notes')
        .select('*, profiles!notes_profile_id_fkey(full_name)')
        .eq('year', yearNum)
        .ilike('department', `%${deptKey}%`)
        .eq('semester', semKey)
        .eq('subject', subjectName)
        .order('created_at', { ascending: false })

    const uploadUrl = `/notes/upload?year=${yearNum}&dept=${deptKey}&sem=${semKey}&subject=${encodeURIComponent(subjectName)}`

    const isSubfolder = subjectName.startsWith('PYQ - ') || subjectName.startsWith('Video - ')

    return (
        <div className="min-h-screen p-8 pt-32 text-[#ededed]">
            <div className="max-w-4xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 flex-wrap mb-12 text-sm font-bold">
                    <Link href="/notes" className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">Notes</Link>
                    <span className="text-gray-700">/</span>
                    <Link href={`/notes/year/${yearNum}`} className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">{yearMeta.label}</Link>
                    <span className="text-gray-700">/</span>
                    <Link href={`/notes/year/${yearNum}/dept/${semKey}`} className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">{semKey}</Link>
                    <span className="text-gray-700">/</span>
                    <Link href={`/notes/year/${yearNum}/dept/${deptKey}/${semKey}`} className={`${style.accent} uppercase tracking-widest hover:text-white transition-all`}>{deptKey}</Link>
                    <span className="text-gray-700">/</span>
                    <span className="text-white font-black truncate max-w-[200px]">{subjectName}</span>
                </div>

                {/* Subject Header */}
                <div className={`glass-card mb-10 bg-gradient-to-br ${style.color} border ${style.border}`}>
                    <div className="flex items-start justify-between gap-6 flex-wrap">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">{deptMeta.emoji}</div>
                            <div>
                                <p className={`text-[10px] font-black tracking-[0.3em] uppercase ${style.accent}`}>{yearMeta.label} · {semKey} · {deptKey}</p>
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-1">{subjectName}</h1>
                            </div>
                        </div>
                        <Link
                            href={uploadUrl}
                            className={`glass glass-hover px-6 py-3 rounded-full text-xs font-black tracking-widest uppercase ${style.accent} border ${style.border} hover:scale-105 transition-all self-center`}
                        >
                            + Upload for this Subject
                        </Link>
                    </div>
                </div>

                {/* Virtual Folders */}
                {!isSubfolder && (
                    <div className="grid grid-cols-2 gap-6 mb-10">
                        <Link
                            href={`/notes/year/${yearNum}/dept/${deptKey}/${semKey}/${encodeURIComponent('PYQ - ' + subjectName)}`}
                            className="glass-card hover:bg-white/5 transition-all flex items-center gap-4 group cursor-pointer"
                        >
                            <div className="text-3xl group-hover:scale-110 transition-transform">📂</div>
                            <div>
                                <h3 className="text-lg font-black text-white">PYQs</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Past Year Questions</p>
                            </div>
                        </Link>
                        <Link
                            href={`/notes/year/${yearNum}/dept/${deptKey}/${semKey}/${encodeURIComponent('Video - ' + subjectName)}`}
                            className="glass-card hover:bg-white/5 transition-all flex items-center gap-4 group cursor-pointer"
                        >
                            <div className="text-3xl group-hover:scale-110 transition-transform">🎬</div>
                            <div>
                                <h3 className="text-lg font-black text-white">Video Lectures</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Tutorials & Guides</p>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Notes Grid */}
                {notes && notes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {notes.map((note: any) => (
                            <div key={note.id} className="glass-card flex flex-col group">
                                <h3 className="text-lg font-black text-white group-hover:text-glow transition-all mb-2 line-clamp-2">{note.title}</h3>
                                <p className="text-gray-500 text-xs font-medium mb-4 line-clamp-2">{note.description || 'No description.'}</p>
                                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] text-gray-600 font-bold">{note.profiles?.full_name || 'Anonymous'}</span>
                                    <div className="flex gap-3 items-center">
                                        {(profile?.id === note.profile_id || profile?.role === 'exec' || profile?.role === 'core') && (
                                            <DeleteButton onDelete={deleteNote.bind(null, note.id)} itemName="note" />
                                        )}
                                        <InteractionTracker itemType="note" itemId={note.id} interactionType="view" trigger="click">
                                            <a href={note.file_url} target="_blank" rel="noopener noreferrer" className="glass glass-hover px-4 py-2 rounded-xl text-blue-400 text-xs font-black uppercase tracking-widest transition-all">
                                                Open ↗
                                            </a>
                                        </InteractionTracker>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-card text-center py-20 border-dashed">
                        <p className="text-4xl mb-4">📂</p>
                        <p className="text-gray-600 font-bold uppercase text-xs tracking-widest mb-6">No notes uploaded for this subject yet</p>
                        <Link href={uploadUrl} className={`${style.accent} font-black text-xs uppercase tracking-widest hover:text-white transition-colors`}>
                            Be the first to contribute →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
