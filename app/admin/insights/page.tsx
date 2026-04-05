import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminInsightsPage() {
    const supabase = await createClient()

    // 1. Check if user is exec
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'exec' && profile?.role !== 'core') redirect('/dashboard')

    // 2. Fetch recent interactions with user profiles and item details
    // Note: We'll join with profiles for user data. 
    // Item titles will be harder to join directly due to polymorphism, 
    // so we'll fetch them in parallel if needed or just show the ID for now.
    const { data: logs, error } = await supabase
        .from('interaction_logs')
        .select(`
            *,
            profiles ( full_name, roll_number )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

    if (error) console.error('Fetch logs error:', error)

    return (
        <div className="min-h-screen p-8 text-[#ededed]">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12">
                    <Link href="/admin" className="text-gray-500 hover:text-white transition-all text-sm font-bold uppercase tracking-widest">
                        ← Admin Panel
                    </Link>
                    <div className="mt-4 space-y-1">
                        <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">System Insights</p>
                        <h1 className="text-4xl font-black tracking-tighter text-white">Activity Tracker</h1>
                        <p className="text-gray-500 text-sm">Monitor how members are interacting with the platform.</p>
                    </div>
                </header>

                <div className="glass rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Member</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Activity</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Target</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {logs && logs.length > 0 ? (
                                    logs.map((log: any) => (
                                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400 font-bold uppercase">
                                                        {log.profiles?.full_name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white leading-tight">{log.profiles?.full_name || 'Anonymous'}</p>
                                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{log.profiles?.roll_number}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${log.interaction_type === 'download'
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                        : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                    }`}>
                                                    {log.interaction_type}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{log.item_type.replace('_', ' ')}</p>
                                                    <p className="text-[11px] font-mono text-white/40 truncate max-w-[150px]">{log.item_id}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-bold text-gray-400">
                                                    {new Date(log.created_at).toLocaleString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <p className="text-gray-500 font-bold tracking-widest uppercase">No activities logged yet.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
