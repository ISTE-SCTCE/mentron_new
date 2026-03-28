import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import { FIRST_YEAR_GROUPS, getFirstYearSubjects, GroupKey } from '@/app/lib/data/subjects'
import { InteractionTracker } from '@/app/components/InteractionTracker'

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
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
        .single()

    // Fetch notes matching year=1 and a group label filter
    const { data: notes } = await supabase
        .from('notes')
        .select('*, profiles!notes_profile_id_fkey(full_name)')
        .eq('year', 1)
        .ilike('department', `%Group ${groupKey}%`)
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen p-8 pt-32 text-[#ededed]">
            <div className="max-w-6xl mx-auto">
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
                    <div className="flex items-center gap-6 flex-wrap">
                        <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center text-4xl">{groupMeta.emoji}</div>
                        <div>
                            <p className={`text-[10px] font-black tracking-[0.3em] uppercase ${style.accent}`}>1st Year · {sem}</p>
                            <h1 className="text-4xl font-black tracking-tighter text-white mt-1">{groupMeta.label}</h1>
                            <p className={`text-sm font-bold mt-1 ${style.accent}`}>{groupMeta.streams}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Subjects List */}
                    <div>
                        <h2 className="text-xs font-black tracking-[0.2em] text-blue-500 uppercase mb-6">Subjects — {sem}</h2>
                        <div className="space-y-3">
                            {subjects.map((subject, idx) => (
                                <div key={idx} className="glass p-4 rounded-xl flex items-start gap-4 border border-white/5 hover:border-white/10 transition-all">
                                    <span className={`w-7 h-7 shrink-0 rounded-lg ${style.color} border ${style.border} flex items-center justify-center text-[10px] font-black ${style.accent}`}>
                                        {idx + 1}
                                    </span>
                                    <span className="text-sm text-white font-medium leading-snug">{subject}</span>
                                </div>
                            ))}
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
