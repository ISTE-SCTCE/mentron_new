'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Profile = {
    id: string
    full_name: string
    roll_number: string
    department: string
    year: string
    role: string
}

export default function PanelMembersPage() {
    const supabase = createClient()
    const router = useRouter()

    const [members, setMembers] = useState<Profile[]>([])
    const [filtered, setFiltered] = useState<Profile[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // ── 1. Auth guard: must be panel member ───────────────────────────────────
    useEffect(() => {
        async function checkAccess() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.replace('/login'); return }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'panel') {
                router.replace('/dashboard')
            }
        }
        checkAccess()
    }, [supabase, router])

    // ── 2. Fetch all profiles ─────────────────────────────────────────────────
    const fetchMembers = useCallback(async () => {
        setLoading(true)
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, roll_number, department, year, role')
            .order('full_name', { ascending: true })

        const list = (data ?? []) as Profile[]
        setMembers(list)
        setFiltered(list)
        setLoading(false)
    }, [supabase])

    useEffect(() => { fetchMembers() }, [fetchMembers])

    // ── 3. Search filter ──────────────────────────────────────────────────────
    useEffect(() => {
        const q = search.toLowerCase()
        setFiltered(
            members.filter(
                (m) =>
                    m.full_name?.toLowerCase().includes(q) ||
                    m.roll_number?.toLowerCase().includes(q) ||
                    m.department?.toLowerCase().includes(q)
            )
        )
    }, [search, members])

    // ── 4. Role change ────────────────────────────────────────────────────────
    const handleRoleChange = async (profileId: string, newRole: 'member' | 'exec') => {
        setUpdating(profileId)
        try {
            const res = await fetch('/api/panel/update-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId, newRole }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error ?? 'Unknown error')

            setMembers((prev) =>
                prev.map((m) => (m.id === profileId ? { ...m, role: newRole } : m))
            )
            setToast({ msg: `Role updated to ${newRole}`, ok: true })
        } catch (e: any) {
            setToast({ msg: e.message ?? 'Failed', ok: false })
        } finally {
            setUpdating(null)
            setTimeout(() => setToast(null), 3000)
        }
    }

    // ── 5. Role badge colour ──────────────────────────────────────────────────
    const roleStyle = (role: string) => {
        if (role === 'exec') return 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
        return 'bg-white/5 text-gray-400 border border-white/10'
    }

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 md:px-10 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-12 space-y-2">
                <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase flex items-center gap-2">
                    <span className="w-8 h-[1px] bg-blue-500 inline-block" />
                    Panel Control
                </p>
                <h1 className="text-5xl font-black tracking-tighter text-white">
                    Manage Members
                </h1>
                <p className="text-gray-500 font-medium">
                    View all Mentron members and promote or demote their roles.
                </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                    { label: 'Total Members', value: members.length, icon: '👥' },
                    { label: 'Executive Members', value: members.filter((m) => m.role === 'exec').length, icon: '⭐' },
                    { label: 'Normal Members', value: members.filter((m) => m.role === 'member').length, icon: '🎓' },
                    { label: 'Panel Members', value: 1, icon: '🔐' },
                ].map((stat) => (
                    <div key={stat.label} className="glass-card text-center space-y-1">
                        <div className="text-3xl">{stat.icon}</div>
                        <div className="text-3xl font-black text-white">{stat.value}</div>
                        <div className="text-[10px] font-black tracking-widest text-gray-500 uppercase">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search by name, roll number, department…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                />
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center items-center py-32 text-gray-500 font-bold tracking-widest text-xs uppercase">
                    Loading members…
                </div>
            ) : (
                <div className="glass rounded-[2rem] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left px-6 py-4 text-[10px] font-black tracking-[0.2em] text-blue-500 uppercase">Member</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black tracking-[0.2em] text-blue-500 uppercase hidden md:table-cell">Roll No.</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black tracking-[0.2em] text-blue-500 uppercase hidden lg:table-cell">Department</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black tracking-[0.2em] text-blue-500 uppercase hidden lg:table-cell">Year</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black tracking-[0.2em] text-blue-500 uppercase">Role</th>
                                    <th className="text-center px-6 py-4 text-[10px] font-black tracking-[0.2em] text-blue-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-16 text-gray-600 font-bold uppercase text-xs tracking-widest">
                                            No members found
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((m, idx) => (
                                        <tr
                                            key={m.id}
                                            className={`border-b border-white/5 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
                                        >
                                            {/* Member */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm font-black text-white shrink-0">
                                                        {m.full_name?.[0] ?? '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white leading-tight">{m.full_name || '—'}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Roll No. */}
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <span className="text-sm font-bold text-white uppercase">{m.roll_number || '—'}</span>
                                            </td>

                                            {/* Department */}
                                            <td className="px-6 py-4 hidden lg:table-cell">
                                                <span className="text-sm text-gray-400">{m.department || '—'}</span>
                                            </td>

                                            {/* Year */}
                                            <td className="px-6 py-4 hidden lg:table-cell">
                                                <span className="text-sm text-gray-400">{m.year || '—'}</span>
                                            </td>

                                            {/* Role Badge */}
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${roleStyle(m.role)}`}>
                                                    {m.role || 'member'}
                                                </span>
                                            </td>

                                            {/* Action */}
                                            <td className="px-6 py-4 text-center">
                                                {m.role === 'member' ? (
                                                    <button
                                                        disabled={updating === m.id}
                                                        onClick={() => handleRoleChange(m.id, 'exec')}
                                                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {updating === m.id ? '…' : 'Promote'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled={updating === m.id}
                                                        onClick={() => handleRoleChange(m.id, 'member')}
                                                        className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {updating === m.id ? '…' : 'Demote'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all z-50 ${
                        toast.ok
                            ? 'bg-blue-600 text-white'
                            : 'bg-red-500/90 text-white'
                    }`}
                >
                    {toast.msg}
                </div>
            )}
        </div>
    )
}
