import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import { GroupKey } from '@/app/lib/data/subjects'
import { InteractionTracker } from '@/app/components/InteractionTracker'
import { DeleteButton } from '@/app/components/DeleteButton'
import { deleteNote } from '@/app/lib/actions/deleteActions'
import { NoteAccessGate } from '@/app/components/NoteAccessGate'

const GROUP_COLORS: Record<GroupKey, { color: string; border: string; accent: string }> = {
    A: { color: 'from-blue-500/20 to-cyan-500/10', border: 'border-blue-500/20', accent: 'text-blue-400' },
    B: { color: 'from-yellow-500/20 to-amber-500/10', border: 'border-yellow-500/20', accent: 'text-yellow-400' },
    C: { color: 'from-orange-500/20 to-red-500/10', border: 'border-orange-500/20', accent: 'text-orange-400' },
    D: { color: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/20', accent: 'text-green-400' },
}

const VALID_GROUPS: GroupKey[] = ['A', 'B', 'C', 'D']
const VALID_SEMS = ['S1', 'S2']

export default async function Year1FolderNotesPage({
    params,
}: {
    params: Promise<{ group: string; sem: string; subject: string; folderId: string }>
}) {
    const { group, sem, subject, folderId } = await params
    const groupKey = group.toUpperCase() as GroupKey
    const subjectName = decodeURIComponent(subject)

    if (!VALID_GROUPS.includes(groupKey) || !VALID_SEMS.includes(sem)) {
        notFound()
    }

    const style = GROUP_COLORS[groupKey]

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, iste_id')
        .eq('id', user?.id ?? '')
        .single()

    const { data: folder } = await supabase
        .from('note_folders')
        .select('id, name, requires_auth')
        .eq('id', folderId)
        .maybeSingle()

    if (!folder) notFound()

    // Fetch notes in this folder
    const { data: notes } = await supabase
        .from('notes')
        .select('*, profiles!notes_profile_id_fkey(full_name)')
        .eq('year', 1)
        .eq('department', groupKey)
        .eq('semester', sem)
        .eq('subject', subjectName)
        .eq('folder_id', folderId)
        .order('created_at', { ascending: false })

    const subjectUrl = `/notes/year/1/group/${groupKey}/${sem}/${encodeURIComponent(subjectName)}`
    const uploadUrl = `/notes/upload?year=1&dept=${groupKey}&sem=${sem}&subject=${encodeURIComponent(subjectName)}&folder_id=${folderId}`

    return (
        <div className="min-h-screen p-4 md:p-8 pt-20 md:pt-32 text-[#ededed]">
            <div className="max-w-4xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 flex-wrap mb-12 text-sm font-bold">
                    <Link href="/notes" className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">Notes</Link>
                    <span className="text-gray-700">/</span>
                    <Link href="/notes/year/1" className="text-gray-500 hover:text-white transition-all uppercase tracking-widest">1st Year</Link>
                    <span className="text-gray-700">/</span>
                    <Link href={`/notes/year/1/group/${groupKey}/${sem}`} className={`${style.accent} uppercase tracking-widest hover:text-white transition-all`}>Group {groupKey}</Link>
                    <span className="text-gray-700">/</span>
                    <Link href={subjectUrl} className="text-gray-500 hover:text-white transition-all uppercase tracking-widest truncate max-w-[140px]">{subjectName}</Link>
                    <span className="text-gray-700">/</span>
                    <span className="text-white font-black truncate max-w-[140px]">📁 {folder.name}</span>
                </div>

                {/* Folder Header */}
                <div className={`glass-card mb-10 bg-gradient-to-br ${style.color} border ${style.border}`}>
                    <div className="flex items-start justify-between gap-6 flex-wrap">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">📁</div>
                            <div>
                                <p className={`text-[10px] font-black tracking-[0.3em] uppercase ${style.accent}`}>
                                    1st Year · {sem} · Group {groupKey} · {subjectName}
                                </p>
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-1">{folder.name}</h1>
                                <p className="text-gray-500 text-xs mt-1 font-bold">Custom Folder</p>
                            </div>
                        </div>
                        <Link
                            href={uploadUrl}
                            className={`glass glass-hover px-6 py-3 rounded-full text-xs font-black tracking-widest uppercase ${style.accent} border ${style.border} hover:scale-105 transition-all self-center`}
                        >
                            + Upload to this Folder
                        </Link>
                    </div>
                </div>

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
                                        <NoteAccessGate 
                                            noteUrl={note.file_url} 
                                            userId={profile?.id} 
                                            userIsteId={profile?.iste_id} 
                                            userRole={profile?.role}
                                            title={note.title}
                                            requiresAuth={folder.requires_auth ?? false}
                                        >
                                            <InteractionTracker itemType="note" itemId={note.id} interactionType="view" trigger="click">
                                                <button className="glass glass-hover px-4 py-2 rounded-xl text-blue-400 text-xs font-black uppercase tracking-widest transition-all">
                                                    View Note
                                                </button>
                                            </InteractionTracker>
                                        </NoteAccessGate>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-card text-center py-20 border-dashed">
                        <p className="text-4xl mb-4">📁</p>
                        <p className="text-gray-600 font-bold uppercase text-xs tracking-widest mb-6">
                            No notes in this folder yet
                        </p>
                        <Link href={uploadUrl} className={`${style.accent} font-black text-xs uppercase tracking-widest hover:text-white transition-colors`}>
                            Upload to this folder →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
