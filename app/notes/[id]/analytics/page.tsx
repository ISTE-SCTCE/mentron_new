import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function NoteAnalyticsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const supabase = await createClient()
    const { id } = await params

    // 1. Fetch current user and profile
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // 2. Fetch the note to check ownership and get basic details
    const { data: note, error: noteError } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single()

    if (noteError || !note) {
        redirect('/notes')
    }

    // 3. Authorization Check
    // User must be the uploader OR an exec
    if (profile?.id !== note.profile_id && profile?.role !== 'exec') {
        redirect('/notes')
    }

    // 4. Fetch Views from interaction_logs
    const { data: logs, error: logsError } = await supabase
        .from('interaction_logs')
        .select(`
            id,
            created_at,
            user_id,
            profiles (
                full_name,
                email,
                role
            )
        `)
        .eq('item_type', 'note')
        .eq('item_id', id)
        .eq('interaction_type', 'view')
        .order('created_at', { ascending: false })

    if (logsError) {
        console.error('Error fetching logs:', logsError)
    }

    // Deduplicate views by user_id to get unique viewers if needed, 
    // or just show total views vs unique views.
    const validLogs = logs || []
    const uniqueViewers = Array.from(new Set(validLogs.map(log => log.user_id)))

    return (
        <div className="min-h-screen p-8 text-[#ededed]">
            <div className="max-w-4xl mx-auto">
                <Link href="/notes" className="text-gray-500 hover:text-white transition-all text-sm font-bold uppercase tracking-widest mb-12 inline-block">
                    ← Back to Notes
                </Link>

                <header className="mb-12 flex flex-col gap-4">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black tracking-[0.3em] text-purple-500 uppercase">Analytics Panel</p>
                        <h1 className="text-4xl font-black tracking-tighter text-white">{note.title}</h1>
                        <p className="text-gray-400 text-sm mt-2">{note.description}</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="glass p-8 rounded-3xl flex flex-col items-center justify-center text-center">
                        <span className="text-5xl font-black text-white">{validLogs.length}</span>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">Total Views</span>
                    </div>
                    <div className="glass p-8 rounded-3xl flex flex-col items-center justify-center text-center">
                        <span className="text-5xl font-black text-purple-400">{uniqueViewers.length}</span>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">Unique Viewers</span>
                    </div>
                </div>

                <div className="glass rounded-[2rem] overflow-hidden">
                    <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest">Viewer Log</h2>
                    </div>
                    <div className="p-2">
                        {validLogs.length > 0 ? (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-white/5">User</th>
                                        <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-white/5">Role</th>
                                        <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-white/5">Viewed At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {validLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4 border-b border-white/5 group-last:border-0">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white tracking-wide">
                                                        {(log.profiles as any)?.full_name || 'Anonymous Student'}
                                                    </span>
                                                    <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">
                                                        {(log.profiles as any)?.email || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 border-b border-white/5 group-last:border-0">
                                                <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-md ${(log.profiles as any)?.role === 'exec'
                                                        ? 'bg-purple-500/20 text-purple-400'
                                                        : 'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {(log.profiles as any)?.role || 'student'}
                                                </span>
                                            </td>
                                            <td className="p-4 border-b border-white/5 group-last:border-0 text-sm text-gray-400 whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-16 text-center text-gray-500 font-bold uppercase tracking-widest text-sm animate-pulse">
                                No views yet
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
