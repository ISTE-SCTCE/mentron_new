import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import { InteractionTracker } from '@/app/components/InteractionTracker'
import { NotesSearch } from './NotesSearch'
import { ThemeSwitcher } from '@/app/components/ThemeSwitcher'
import { DeleteButton } from '@/app/components/DeleteButton'
import { deleteNote } from '@/app/lib/actions/deleteActions'
import { NoteAccessGate } from '@/app/components/NoteAccessGate'
import { getPermissions } from '@/app/lib/utils/coreAuth'
import { MigrateSubjectsButton } from './MigrateSubjectsButton'

const YEARS = [
    { year: 1, label: '1st Year', sems: 'S1 & S2', emoji: '🌱', color: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/20', accent: 'text-green-400' },
    { year: 2, label: '2nd Year', sems: 'S3 & S4', emoji: '📘', color: 'from-blue-500/20 to-cyan-500/10', border: 'border-blue-500/20', accent: 'text-blue-400' },
    { year: 3, label: '3rd Year', sems: 'S5 & S6', emoji: '🔬', color: 'from-purple-500/20 to-violet-500/10', border: 'border-purple-500/20', accent: 'text-purple-400' },
    { year: 4, label: '4th Year', sems: 'S7 & S8', emoji: '🎓', color: 'from-orange-500/20 to-amber-500/10', border: 'border-orange-500/20', accent: 'text-orange-400' },
]

export default async function NotesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    const resolvedSearchParams = await searchParams
    const query = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : ''
    const filter = typeof resolvedSearchParams.filter === 'string' ? resolvedSearchParams.filter : 'all'

    // Fetch notes only when search/filter is active
    let notes: any[] | null = null
    if (query || filter === 'contributions') {
        let dbQuery = supabase
            .from('notes')
            .select('*, profiles!notes_profile_id_fkey(full_name)')
            .order('created_at', { ascending: false })

        if (query) {
            dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        }
        if (filter === 'contributions' && profile) {
            dbQuery = dbQuery.eq('profile_id', profile.id)
        }

        const { data, error } = await dbQuery
        notes = data
        if (error) console.error('Fetch notes error:', error)
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8 pt-20 sm:pt-28 md:pt-32 text-[#ededed]">
            <div className="max-w-[1800px] mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0 mb-8 sm:mb-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black tracking-[0.3em] text-cyan-400 uppercase flex items-center gap-2">
                                <span className="w-8 h-[1px] bg-gradient-to-r from-purple-500 to-cyan-400 inline-block" />
                                Knowledge Base
                            </p>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white">Academic Notes</h1>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6 w-full md:w-auto">
                        <ThemeSwitcher />
                        {(await getPermissions()).can_upload_notes && (
                            <Link
                                href="/notes/upload"
                                className="glass glass-hover px-5 sm:px-6 py-2.5 rounded-full text-xs font-black tracking-widest uppercase text-cyan-300 border-cyan-500/30 shadow-[0_0_15px_rgba(0,198,255,0.15)] transition-all"
                            >
                                + Contribute Notes
                            </Link>
                        )}
                    </div>
                </header>

                {/* Search bar */}
                <div className="mb-10">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-4">
                        <div className="w-full">
                            <NotesSearch initialQuery={query} initialFilter={filter} />
                        </div>
                        {(profile?.role === 'exec' || profile?.role === 'core' || profile?.role === 'admin') && (
                            <div className="shrink-0">
                                <MigrateSubjectsButton />
                            </div>
                        )}
                    </div>
                </div>

                {/* Search results OR Year cards */}
                {(query || filter === 'contributions') ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-6 md:gap-8 mt-4">
                        {notes && notes.length > 0 ? (
                            notes.map((note) => (
                                <div key={note.id} className="glass-card flex flex-col group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6">
                                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all">📄</div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/10">{note.department}</span>
                                        <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/10">{note.year} Year</span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black text-white group-hover:text-glow transition-all mb-3 md:mb-4 line-clamp-2">{note.title}</h2>
                                    <p className="text-gray-400 text-xs md:text-sm font-medium mb-6 md:mb-8 line-clamp-3 leading-relaxed">{note.description || 'No description provided.'}</p>
                                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Uploaded By</span>
                                            <span className="text-xs font-bold text-white">{note.profiles?.full_name || 'Anonymous Student'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {(profile?.id === note.profile_id || profile?.role === 'exec' || profile?.role === 'core' || profile?.role === 'admin') && (
                                                <Link href={`/notes/${note.id}/analytics`} className="glass glass-hover p-3 rounded-xl flex items-center justify-center text-purple-400 text-sm hover:scale-110 transition-all font-bold" title="View Analytics">
                                                    📊 View
                                                </Link>
                                            )}
                                            {(profile?.id === note.profile_id || profile?.role === 'exec' || profile?.role === 'core' || profile?.role === 'admin') && (
                                                <DeleteButton onDelete={deleteNote.bind(null, note.id)} itemName="note" />
                                            )}
                                            <NoteAccessGate 
                                                noteUrl={note.file_url} 
                                                userId={profile?.id} 
                                                userIsteId={profile?.iste_id} 
                                                userRole={profile?.role}
                                                title={note.title}
                                                requiresAuth={false}
                                            >
                                                <InteractionTracker itemType="note" itemId={note.id} interactionType="view" trigger="click">
                                                    <button className="glass glass-hover p-3 rounded-xl text-blue-400 text-sm hover:scale-110 transition-all font-bold" title="View Document">
                                                        View Note
                                                    </button>
                                                </InteractionTracker>
                                            </NoteAccessGate>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 sm:py-28 text-center glass-card border-white/10 rounded-3xl p-6">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-gray-500">
                                    🔍
                                </div>
                                <p className="text-gray-300 text-base font-bold mb-2">No notes found</p>
                                <p className="text-gray-500 text-xs sm:text-sm max-w-sm mx-auto mb-6">We couldn&apos;t find any notes matching your search criteria. Try a different query or filter.</p>
                                <Link href="/notes" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
                                    Clear search →
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── Year Cards ── */
                    <div>
                        <div className="mb-8">
                            <p className="text-[10px] font-black tracking-[0.3em] text-cyan-400 uppercase flex items-center gap-2">
                                <span className="w-8 h-[1px] bg-gradient-to-r from-purple-500 to-cyan-400 inline-block" />
                                Browse by Year
                            </p>
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter mt-2">Select Your Year</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                            {YEARS.map(({ year, label, sems, emoji, color, border, accent }) => (
                                <Link
                                    key={year}
                                    href={`/notes/year/${year}`}
                                    className={`glass-card p-6 sm:p-8 rounded-3xl group bg-gradient-to-br ${color} border ${border} hover:scale-[1.02] transition-all block`}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl sm:text-3xl grayscale group-hover:grayscale-0 transition-all">
                                            {emoji}
                                        </div>
                                        <span className={`text-[10px] font-black tracking-widest uppercase ${accent} px-2.5 py-1 rounded-lg bg-white/5 border border-white/10`}>{sems}</span>
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-white group-hover:text-glow transition-all mb-2 tracking-tighter">{label}</h2>
                                    <p className="text-gray-400 text-xs sm:text-sm font-medium mb-6">Browse notes by semester</p>
                                    <div className={`flex items-center gap-2 ${accent} text-xs font-black uppercase tracking-widest`}>
                                        <span>Select Semester</span>
                                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
