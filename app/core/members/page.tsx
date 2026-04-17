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

export default function CoreMembersPage() {
    const supabase = createClient()
    const router = useRouter()

    const [members, setMembers] = useState<Profile[]>([])
    const [filtered, setFiltered] = useState<Profile[]>([])
    const [search, setSearch] = useState('')
    const [filterDept, setFilterDept] = useState('All')
    const [filterYear, setFilterYear] = useState('All')
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [currentUserRole, setCurrentUserRole] = useState<string>('')
    const [userPermissions, setUserPermissions] = useState<any>(null)
    const [isLeadership, setIsLeadership] = useState(false)

    // ── 1. Auth guard: must be core/exec ─────────────────────────────────────
    useEffect(() => {
        async function checkAccess() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.replace('/login'); return }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role, permissions, iste_position')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'core' && profile?.role !== 'exec') {
                router.replace('/dashboard')
            } else {
                setCurrentUserRole(profile.role)
                setIsLeadership(profile.iste_position === 'Chairman' || profile.iste_position === 'Vice Chairman')
                
                // Set permissions: Leadership gets all, otherwise use profile.permissions
                if (profile.iste_position === 'Chairman' || profile.iste_position === 'Vice Chairman') {
                    setUserPermissions({
                        can_see_member_info: true,
                        can_delete_account: true,
                        can_upload_notes: true
                    })
                } else {
                    setUserPermissions(profile.permissions || {
                        can_see_member_info: false,
                        can_delete_account: false,
                        can_upload_notes: true
                    })
                }
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
            .not('role', 'in', '("core", "exec")')
            .order('full_name', { ascending: true })

        const list = (data ?? []) as Profile[]
        setMembers(list)
        setFiltered(list)
        setLoading(false)
    }, [supabase])

    useEffect(() => { fetchMembers() }, [fetchMembers])

    // ── 3. Search & Filters ───────────────────────────────────────────────────
    useEffect(() => {
        const q = search.toLowerCase()
        setFiltered(
            members.filter((m) => {
                const matchesSearch = 
                    m.full_name?.toLowerCase().includes(q) ||
                    m.roll_number?.toLowerCase().includes(q) ||
                    m.department?.toLowerCase().includes(q);
                const matchesDept = filterDept === 'All' || m.department === filterDept;
                const matchesYear = filterYear === 'All' || String(m.year) === filterYear;
                return matchesSearch && matchesDept && matchesYear;
            })
        )
    }, [search, filterDept, filterYear, members])

    // ── 4. Form Options ───────────────────────────────────────────────────────
    const departments = ['All', ...Array.from(new Set(members.map(m => m.department).filter(Boolean))).sort()]
    const years = ['All', '1', '2', '3', '4']

    // ── 5. Role change ────────────────────────────────────────────────────────
    const handleRoleChange = async (profileId: string, newRole: 'member' | 'exec') => {
        setUpdating(profileId)
        try {
            const res = await fetch('/api/core/update-role', {
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

    // ── 6. Account Deletion ───────────────────────────────────────────────────
    const handleDeleteUser = async (profileId: string, name: string) => {
        if (!confirm(`Are you absolutely sure you want to delete the account for ${name}? This action cannot be undone.`)) return;
        setUpdating(profileId)
        try {
            const res = await fetch('/api/core/delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error ?? 'Unknown error')

            setMembers((prev) => prev.filter((m) => m.id !== profileId))
            setToast({ msg: 'Account deleted successfully', ok: true })
        } catch (e: any) {
            setToast({ msg: e.message ?? 'Deletion failed', ok: false })
        } finally {
            setUpdating(null)
            setTimeout(() => setToast(null), 3000)
        }
    }

    const roleStyle = (role: string) => {
        if (role === 'exec') return 'bg-blue-500/20 text-blue-400 border-blue-500/40'
        return 'bg-white/5 text-gray-400 border-white/10'
    }

    return (
        <div className="min-h-screen pt-20 md:pt-32 pb-20 px-4 md:px-10 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-12 space-y-2">
                <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase flex items-center gap-2">
                    <span className="w-8 h-[1px] bg-blue-500 inline-block" />
                    Student Management
                </p>
                <h1 className="text-5xl font-black tracking-tighter text-white">
                    Mentron Directory
                </h1>
                <p className="text-gray-500 font-medium">
                    View, filter, edit roles, and manage student accounts seamlessly.
                </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                    { label: 'Total Members', value: members.length, icon: '👥' },
                    { label: 'Executive Members', value: members.filter((m) => m.role === 'exec').length, icon: '⭐' },
                    { label: 'Normal Members', value: members.filter((m) => m.role === 'member').length, icon: '🎓' },
                    { 
                        label: 'Manage Permissions', 
                        value: isLeadership ? 'GO →' : '🔐', 
                        icon: '🛡️',
                        onClick: isLeadership ? () => router.push('/admin/permissions') : undefined
                    },
                ].map((stat) => (
                    <div 
                        key={stat.label} 
                        onClick={stat.onClick}
                        className={`glass-card text-center space-y-1 ${stat.onClick ? 'cursor-pointer hover:border-blue-500/50 transition-all' : ''}`}
                    >
                        <div className="text-3xl">{stat.icon}</div>
                        <div className="text-3xl font-black text-white">{stat.value}</div>
                        <div className="text-[10px] font-black tracking-widest text-gray-500 uppercase">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-10 bg-white/5 p-4 rounded-3xl border border-white/5">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search student name, roll no, department..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                    />
                </div>
                <div className="flex gap-4">
                    <select
                        value={filterDept}
                        onChange={(e) => setFilterDept(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none cursor-pointer"
                    >
                        {departments.map(d => <option key={d} value={d} className="bg-gray-900 text-white">{d === 'All' ? 'All Departments' : d}</option>)}
                    </select>
                    <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none cursor-pointer"
                    >
                        {years.map(y => <option key={y} value={y} className="bg-gray-900 text-white">{y === 'All' ? 'All Years' : `Year ${y}`}</option>)}
                    </select>
                </div>
            </div>

            {/* Grid of ID Cards */}
            {loading ? (
                <div className="flex justify-center items-center py-32 text-gray-500 font-bold tracking-widest text-xs uppercase">
                    Loading members…
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 glass rounded-3xl border border-white/5 mx-auto max-w-lg">
                    <div className="text-4xl mb-4">🔍</div>
                    <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No students found matching your criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((m) => (
                        <div key={m.id} className="glass-card flex flex-col group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20 hover:-translate-y-1 hover:border-blue-500/30">
                            
                            {/* Decorative background element */}
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
                            
                            <div className="flex items-start justify-between mb-6 z-10">
                                <div className="flex gap-4 items-center">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-xl font-black text-white shadow-xl">
                                        {m.full_name?.[0]?.toUpperCase() ?? '?'}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white leading-tight capitalize">{m.full_name || 'Unknown Student'}</h3>
                                        <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${roleStyle(m.role)}`}>
                                            {m.role || 'Member'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {userPermissions?.can_see_member_info ? (
                                <div className="space-y-4 flex-1 z-10 mb-6 bg-black/20 p-4 rounded-2xl border border-white/5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase">Roll Number</span>
                                        <span className="text-white font-bold text-sm tracking-wide bg-white/5 px-2 py-1 rounded-md">{m.roll_number || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase">Department</span>
                                        <span className="text-white font-bold text-sm">{m.department || '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase">Year / Class</span>
                                        <span className="text-blue-400 font-bold text-sm bg-blue-500/10 px-2 flex items-center justify-center rounded-md border border-blue-500/20">
                                            Year {m.year || '?'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 flex-1 z-10 mb-6 bg-black/10 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                    <div className="text-xl opacity-20">🔒</div>
                                    <p className="text-[8px] font-black uppercase text-gray-600 tracking-tighter">Information Restricted</p>
                                </div>
                            )}

                            <div className="flex gap-2 mt-auto z-10 pt-4 border-t border-white/10">
                                {/* Role Promote/Demote Toggle */}
                                {m.role === 'member' ? (
                                    <button
                                        disabled={updating === m.id}
                                        onClick={() => handleRoleChange(m.id, 'exec')}
                                        className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                    >
                                        {updating === m.id ? '...' : 'Promote'}
                                    </button>
                                ) : (
                                    <button
                                        disabled={updating === m.id}
                                        onClick={() => handleRoleChange(m.id, 'member')}
                                        className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                    >
                                        {updating === m.id ? '...' : 'Demote'}
                                    </button>
                                )}
                                
                                {/* Delete Action - Only visible if has permission */}
                                {userPermissions?.can_delete_account && (
                                    <button
                                        disabled={updating === m.id}
                                        onClick={() => handleDeleteUser(m.id, m.full_name)}
                                        className="w-12 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all disabled:opacity-50"
                                        title="Delete Account"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all z-50 animate-in slide-in-from-bottom ${
                        toast.ok ? 'bg-blue-600 text-white' : 'bg-red-500 text-white'
                    }`}
                >
                    {toast.msg}
                </div>
            )}
        </div>
    )
}
