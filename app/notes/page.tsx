import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import { logout } from '@/app/login/actions'
import { InteractionTracker } from '@/app/components/InteractionTracker'
import { NotesSearch } from './NotesSearch'
import { GroupView } from './GroupView'
import { getDepartmentFromRollNumber } from '@/app/lib/utils/departmentMapper'
import { ThemeSwitcher } from '@/app/components/ThemeSwitcher'
import { DeleteButton } from '@/app/components/DeleteButton'
import { deleteNote } from '@/app/lib/actions/deleteActions'

export default async function NotesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()

    // 2. Fetch user profile for display and filtering
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    // Handle search params
    const resolvedSearchParams = await searchParams
    const query = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : ''
    const filter = typeof resolvedSearchParams.filter === 'string' ? resolvedSearchParams.filter : 'all'
    const dept = typeof resolvedSearchParams.dept === 'string' ? resolvedSearchParams.dept : ''
    const year = typeof resolvedSearchParams.year === 'string' ? resolvedSearchParams.year : ''

    // 3. Resilient identity resolution
    // Fallback to user_metadata if profile is missing (helpful for new signups)
    const userRole = profile?.role || user?.user_metadata?.role || 'member'
    const userDept = profile?.department || user?.user_metadata?.department || getDepartmentFromRollNumber(profile?.roll_number || user?.user_metadata?.roll_number) || 'Other'
    const isExecOrAdmin = userRole === 'exec' || userRole === 'admin'

    // Direct Access URL restriction check
    // Allow if user is exec/admin OR if their department is not yet assigned ('Other')
    // URL restriction check removed - allowing all members to browse all depts
    // while still highlighting their own in GroupView.

    // 1. Fetch filtered notes with their author's full name explicitly using the new foreign key
    let dbQuery = supabase
        .from('notes')
        .select('*, profiles!notes_profile_id_fkey(full_name)')
        .order('created_at', { ascending: false })

    if (dept) {
        dbQuery = dbQuery.eq('department', dept)
    }
    // Global access - removing restrictive else-if filter

    if (year && year.toLowerCase() !== 'all') {
        dbQuery = dbQuery.eq('year', parseInt(year))
    }

    if (query) {
        dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    }

    if (filter === 'contributions' && profile) {
        dbQuery = dbQuery.eq('profile_id', profile.id)
    }

    // Only fetch notes if a specific dept/year is selected OR a search query/filter is active
    let notes: any[] | null = null
    if (dept || query || filter === 'contributions') {
        const { data, error } = await dbQuery
        notes = data
        if (error) {
            console.error('Fetch notes error:', error)
        }
    }

    // Always fetch group counts so we can display the number of notes per group
    let countQuery = supabase
        .from('notes')
        .select('department, year')

    // Fetching counts for all depts
    const { data: countData, error: countError } = await countQuery

    const groupCounts: Record<string, number> = {}
    if (countData) {
        countData.forEach(note => {
            const key = `${note.department}-${note.year}`
            groupCounts[key] = (groupCounts[key] || 0) + 1
        })
    }

    return (
        <div className="min-h-screen p-8 pt-32 text-[#ededed]">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0 mb-10 md:mb-16">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
                        <Link href="/dashboard" className="text-gray-500 hover:text-white transition-all text-sm font-bold uppercase tracking-widest">
                            ← Dashboard
                        </Link>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">Knowledge Base</p>
                            <h1 className="text-5xl font-black tracking-tighter text-white">Academic Notes</h1>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 md:gap-6 w-full md:w-auto">
                        <ThemeSwitcher />
                        <Link
                            href="/notes/upload"
                            className="glass glass-hover px-6 py-2.5 rounded-full text-xs font-black tracking-widest uppercase text-blue-400 border-blue-500/20"
                        >
                            + Contribute Notes
                        </Link>
                        <form action={logout}>
                            <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-2.5 rounded-full text-xs font-black tracking-widest uppercase transition-all border border-red-500/20">
                                Logout
                            </button>
                        </form>
                    </div>
                </header>

                {filter !== 'contributions' && !query && (
                    <GroupView userDepartment={userDept} userRole={userRole} currentDept={dept} currentYear={year} groupCounts={groupCounts} />
                )}

                {/* If Dept is selected or active search/filter, show notes */}
                {(dept || query || filter === 'contributions') && (
                    <>
                        <div className="mt-8 border-t border-white/5 pt-8">
                            <NotesSearch initialQuery={query} initialFilter={filter} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-8 md:mt-12">
                            {notes && notes.length > 0 ? (
                                notes.map((note) => (
                                    <div
                                        key={note.id}
                                        className="glass-card flex flex-col group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-6">
                                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all">
                                                📄
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mb-6">
                                            <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/10">
                                                {note.department}
                                            </span>
                                            <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/10">
                                                {note.year} Year
                                            </span>
                                        </div>

                                        <h2 className="text-xl md:text-2xl font-black text-white group-hover:text-glow transition-all mb-3 md:mb-4 line-clamp-2">
                                            {note.title}
                                        </h2>

                                        <p className="text-gray-400 text-xs md:text-sm font-medium mb-6 md:mb-8 line-clamp-3 leading-relaxed">
                                            {note.description || 'No description provided.'}
                                        </p>

                                        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Uploaded By</span>
                                                <span className="text-xs font-bold text-white">
                                                    {note.profiles?.full_name || 'Anonymous Student'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {(profile?.id === note.profile_id || profile?.role === 'exec' || profile?.role === 'admin') && (
                                                    <Link
                                                        href={`/notes/${note.id}/analytics`}
                                                        className="glass glass-hover p-3 rounded-xl flex items-center justify-center text-purple-400 text-sm hover:scale-110 transition-all font-bold"
                                                        title="View Analytics"
                                                    >
                                                        📊 View
                                                    </Link>
                                                )}
                                                {(profile?.id === note.profile_id || profile?.role === 'exec' || profile?.role === 'admin') && (
                                                    <DeleteButton onDelete={deleteNote.bind(null, note.id)} itemName="note" />
                                                )}
                                                <InteractionTracker itemType="note" itemId={note.id} interactionType="view" trigger="click">
                                                    <a
                                                        href={note.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="glass glass-hover p-3 rounded-xl text-blue-400 text-sm hover:scale-110 transition-all"
                                                        title="View Document"
                                                    >
                                                        ↗
                                                    </a>
                                                </InteractionTracker>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-32 text-center glass-card border-dashed">
                                    <p className="text-gray-500 text-lg font-bold tracking-widest uppercase mb-4 animate-pulse">Library Empty</p>
                                    {query || filter === 'contributions' ? (
                                        <Link href="/notes" className="text-blue-500 font-black text-xs uppercase tracking-widest hover:text-white transition-colors">
                                            Clear search and filters →
                                        </Link>
                                    ) : (
                                        <Link href="/notes/upload" className="text-blue-500 font-black text-xs uppercase tracking-widest hover:text-white transition-colors">
                                            Be the first to contribute →
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
