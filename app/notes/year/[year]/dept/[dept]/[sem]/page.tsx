import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import { DEPARTMENTS, DeptKey, SemKey, getSubjects } from '@/app/lib/data/subjects'
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
const VALID_SEMS = ['S3', 'S4', 'S5', 'S6', 'S7', 'S8']

export default async function DeptSubjectsPage({
    params,
}: {
    params: Promise<{ year: string; dept: string; sem: string }>
}) {
    const { year, dept, sem } = await params
    const yearNum = parseInt(year)
    const deptKey = dept.toUpperCase() as DeptKey
    const semKey = sem.toUpperCase() as SemKey

    if (![2, 3, 4].includes(yearNum) || !VALID_DEPTS.includes(deptKey) || !VALID_SEMS.includes(semKey)) {
        notFound()
    }

    const deptMeta = DEPARTMENTS[deptKey]
    const style = DEPT_COLORS[deptKey]
    const yearMeta = YEAR_META[yearNum]
    const subjects = getSubjects(deptKey, semKey)

    const supabase = await createClient()
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
        .single()

    const { data: notes } = await supabase
        .from('notes')
        .select('*, profiles!notes_profile_id_fkey(full_name)')
        .eq('year', yearNum)
        .ilike('department', `%${deptKey}%`)
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen p-8 pt-32 text-[#ededed]">
            <div className="max-w-6xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 flex-wrap mb-12 text-sm font-bold">
                    <Link href="/notes" className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">Notes</Link>
                    <span className="text-gray-700">/</span>
                    <Link href={`/notes/year/${yearNum}`} className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">{yearMeta.label}</Link>
                    <span className="text-gray-700">/</span>
                    <Link href={`/notes/year/${yearNum}/dept/${semKey}`} className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">{semKey}</Link>
                    <span className="text-gray-700">/</span>
                    <span className={`${style.accent} uppercase tracking-widest`}>{deptKey}</span>
                </div>

                {/* Header card */}
                <div className={`glass-card mb-12 bg-gradient-to-br ${style.color} border ${style.border}`}>
                    <div className="flex items-center gap-6 flex-wrap">
                        <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center text-4xl">{deptMeta.emoji}</div>
                        <div>
                            <p className={`text-[10px] font-black tracking-[0.3em] uppercase ${style.accent}`}>{yearMeta.label} · {semKey}</p>
                            <h1 className="text-4xl font-black tracking-tighter text-white mt-1">{deptMeta.name}</h1>
                            <p className={`text-sm font-bold mt-1 ${style.accent}`}>{deptKey}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Subjects */}
                    <div>
                        <h2 className="text-xs font-black tracking-[0.2em] text-blue-500 uppercase mb-6">Subjects — {semKey}</h2>
                        <div className="space-y-3">
                            {subjects.length > 0 ? subjects.map((subject, idx) => {
                                const isElective = subject.startsWith('— Electives:')
                                if (isElective) {
                                    const electives = subject.replace('— Electives: ', '').split(', ')
                                    return (
                                        <div key={idx} className="glass p-4 rounded-xl border border-white/5">
                                            <p className={`text-[10px] font-black tracking-widest uppercase ${style.accent} mb-3`}>Open Electives (choose one)</p>
                                            <div className="flex flex-wrap gap-2">
                                                {electives.map((e, i) => (
                                                    <span key={i} className={`px-3 py-1 glass rounded-full text-xs font-medium border ${style.border} ${style.accent}`}>{e}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                }
                                return (
                                    <div key={idx} className="glass p-4 rounded-xl flex items-start gap-4 border border-white/5 hover:border-white/10 transition-all">
                                        <span className={`w-7 h-7 shrink-0 rounded-lg ${style.color} border ${style.border} flex items-center justify-center text-[10px] font-black ${style.accent}`}>
                                            {idx + 1}
                                        </span>
                                        <span className="text-sm text-white font-medium leading-snug">{subject}</span>
                                    </div>
                                )
                            }) : (
                                <p className="text-gray-600 text-sm">No subjects data available.</p>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xs font-black tracking-[0.2em] text-blue-500 uppercase">Uploaded Notes</h2>
                            <Link href="/notes/upload" className="glass glass-hover px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase text-blue-400 border-blue-500/20">
                                + Contribute
                            </Link>
                        </div>
                        {notes && notes.length > 0 ? (
                            <div className="space-y-4">
                                {notes.map((note: any) => (
                                    <div key={note.id} className="glass-card flex flex-col group">
                                        <h3 className="text-lg font-black text-white group-hover:text-glow transition-all mb-2 line-clamp-2">{note.title}</h3>
                                        <p className="text-gray-500 text-xs font-medium mb-4 line-clamp-2">{note.description || 'No description.'}</p>
                                        <div className="mt-auto flex items-center justify-between">
                                            <span className="text-[10px] text-gray-600 font-bold">{note.profiles?.full_name || 'Anonymous'}</span>
                                            <InteractionTracker itemType="note" itemId={note.id} interactionType="view" trigger="click">
                                                <a href={note.file_url} target="_blank" rel="noopener noreferrer" className="glass glass-hover px-4 py-2 rounded-xl text-blue-400 text-xs font-black uppercase tracking-widest transition-all">
                                                    Open ↗
                                                </a>
                                            </InteractionTracker>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="glass-card text-center py-16 border-dashed">
                                <p className="text-gray-600 font-bold uppercase text-xs tracking-widest mb-4">No notes yet</p>
                                <Link href="/notes/upload" className="text-blue-500 font-black text-xs uppercase tracking-widest hover:text-white transition-colors">
                                    Be the first to contribute →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
