import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { InsightCounters } from './InsightCounters'

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

    const totalLogs = logs?.length || 0
    const downloadLogs = logs?.filter((l: any) => l.interaction_type === 'download').length || 0
    const viewLogs = logs?.filter((l: any) => l.interaction_type === 'view' || l.interaction_type === 'read').length || 0

    return (
        <div className="min-h-screen pt-20 sm:pt-28 md:pt-32 pb-20 px-4 sm:px-6 md:px-8 text-[#ededed]">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 sm:mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <Link
                            href="/admin"
                            className="text-xs font-bold uppercase tracking-widest text-[#8b9bb4] hover:text-white transition-colors flex items-center gap-1.5"
                        >
                            ← Admin Panel
                        </Link>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="px-3 py-1 glass rounded-full text-[10px] font-black uppercase tracking-widest text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
                            Telemetry Engine
                        </span>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-space-grotesk">
                            Activity Tracker
                        </h1>
                        <p className="text-sm sm:text-base text-[#8b9bb4] max-w-2xl font-medium">
                            Real-time platform telemetry and member engagement audit logs.
                        </p>
                    </div>
                </header>

                {/* Telemetry Quick Counters — animated client component */}
                <InsightCounters totalLogs={totalLogs} downloadLogs={downloadLogs} viewLogs={viewLogs} />

                <div className="glass-card rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="min-w-[650px] w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="px-6 sm:px-8 py-5 text-[10px] font-black text-[#8b9bb4] uppercase tracking-[0.2em]">
                                        Member
                                    </th>
                                    <th className="px-6 sm:px-8 py-5 text-[10px] font-black text-[#8b9bb4] uppercase tracking-[0.2em]">
                                        Activity
                                    </th>
                                    <th className="px-6 sm:px-8 py-5 text-[10px] font-black text-[#8b9bb4] uppercase tracking-[0.2em]">
                                        Target Item
                                    </th>
                                    <th className="px-6 sm:px-8 py-5 text-[10px] font-black text-[#8b9bb4] uppercase tracking-[0.2em]">
                                        Timestamp
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {logs && logs.length > 0 ? (
                                    logs.map((log: any) => (
                                        <tr key={log.id} className="hover:bg-white/[0.03] transition-colors group">
                                            <td className="px-6 sm:px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600/30 to-cyan-600/30 border border-white/10 flex items-center justify-center text-xs text-cyan-300 font-bold uppercase">
                                                        {log.profiles?.full_name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white leading-tight">
                                                            {log.profiles?.full_name || 'Anonymous'}
                                                        </p>
                                                        <p className="text-[10px] text-[#8b9bb4] font-medium tracking-wider mt-0.5">
                                                            {log.profiles?.roll_number || 'External'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 sm:px-8 py-5">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                        log.interaction_type === 'download'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                                    }`}
                                                >
                                                    {log.interaction_type}
                                                </span>
                                            </td>
                                            <td className="px-6 sm:px-8 py-5">
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-black text-[#8b9bb4] uppercase tracking-widest">
                                                        {log.item_type?.replace('_', ' ') || 'Resource'}
                                                    </p>
                                                    <p className="text-[11px] font-mono text-white/50 truncate max-w-[180px]">
                                                        {log.item_id}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 sm:px-8 py-5">
                                                <p className="text-xs font-semibold text-[#8b9bb4]">
                                                    {new Date(log.created_at).toLocaleString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl text-[#8b9bb4]">
                                                    📊
                                                </div>
                                                <p className="text-sm font-bold text-white">No activity logged yet</p>
                                                <p className="text-xs text-[#8b9bb4] max-w-sm">
                                                    Member interactions and download telemetry will populate here in real-time.
                                                </p>
                                            </div>
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
