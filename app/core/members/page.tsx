'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Search, Filter, Shield, User, Star, Trash2 } from 'lucide-react'

type Profile = {
    id: string
    full_name: string
    roll_number: string
    department: string
    year: string | number
    role: string
    iste_position?: string
}

export default function ManageMemberPage() {
    const supabase = createClient()
    const router = useRouter()

    const [allMembers, setAllMembers] = useState<Profile[]>([])
    const [filtered, setFiltered] = useState<Profile[]>([])
    const [viewMode, setViewMode] = useState<'member' | 'exec'>('member')
    const [search, setSearch] = useState('')
    const [filterDept, setFilterDept] = useState('All')
    const [filterYear, setFilterYear] = useState('All')
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [isLeadership, setIsLeadership] = useState(false)
    const [canPromoteDemote, setCanPromoteDemote] = useState(false)
    const [userPermissions, setUserPermissions] = useState<any>(null)

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
                const chairOrVChair = profile.iste_position === 'Chairman' || profile.iste_position === 'Vice Chairman'
                setIsLeadership(chairOrVChair)
                
                const perms = profile.permissions || {}
                setUserPermissions(perms)
                setCanPromoteDemote(chairOrVChair || !!perms.can_promote_demote)
            }
        }
        checkAccess()
    }, [supabase, router])

    // ── 2. Fetch all profiles ─────────────────────────────────────────────────
    const fetchMembers = useCallback(async () => {
        setLoading(true)
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, roll_number, department, year, role, iste_position')
            .not('role', 'eq', 'admin') // Only show member-type and exec-type
            .order('full_name', { ascending: true })

        const list = (data ?? []) as Profile[]
        setAllMembers(list)
        setLoading(false)
    }, [supabase])

    useEffect(() => { fetchMembers() }, [fetchMembers])

    // ── 3. Search & Filters ───────────────────────────────────────────────────
    useEffect(() => {
        const q = search.toLowerCase()
        const filteredList = allMembers.filter((m) => {
            // First level: View Mode (Member tab vs Execom tab)
            // Member tab shows regular students. Execom tab shows core/exec.
            const isExecRole = m.role === 'exec' || m.role === 'core'
            const matchesViewMode = viewMode === 'exec' ? isExecRole : !isExecRole

            const matchesSearch = 
                m.full_name?.toLowerCase().includes(q) ||
                m.roll_number?.toLowerCase().includes(q) ||
                m.department?.toLowerCase().includes(q) ||
                m.iste_position?.toLowerCase().includes(q)
            
            const matchesDept = filterDept === 'All' || m.department === filterDept
            const matchesYear = filterYear === 'All' || String(m.year) === filterYear
            
            return matchesViewMode && matchesSearch && matchesDept && matchesYear
        })
        setFiltered(filteredList)
    }, [search, filterDept, filterYear, allMembers, viewMode])

    // ── 4. Options ───────────────────────────────────────────────────────
    const departments = ['All', ...Array.from(new Set(allMembers.map(m => m.department).filter(Boolean))).sort()]
    const years = ['All', '1', '2', '3', '4']

    // ── 5. Role change ────────────────────────────────────────────────────────
    const handleRoleChange = async (profileId: string, newRole: 'member' | 'exec') => {
        if (!canPromoteDemote) {
            alert("You don't have permission to promote or demote members.")
            return
        }

        setUpdating(profileId)
        try {
            const res = await fetch('/api/core/update-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId, newRole }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error ?? 'Unknown error')

            setAllMembers((prev) =>
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
        if (!userPermissions?.can_delete_account && !isLeadership) {
            alert("You don't have permission to delete accounts.")
            return
        }

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

            setAllMembers((prev) => prev.filter((m) => m.id !== profileId))
            setToast({ msg: 'Account deleted successfully', ok: true })
        } catch (e: any) {
            setToast({ msg: e.message ?? 'Deletion failed', ok: false })
        } finally {
            setUpdating(null)
            setTimeout(() => setToast(null), 3000)
        }
    }

    const roleStyle = (m: Profile) => {
        if (m.role === 'core') return 'bg-purple-500/20 text-purple-400 border-purple-500/40'
        if (m.role === 'exec') return 'bg-blue-500/20 text-blue-400 border-blue-500/40'
        return 'bg-white/5 text-gray-400 border-white/10'
    }

    return (
        <div className="min-h-screen pt-20 md:pt-32 pb-20 px-4 md:px-10 max-w-[1800px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-2">
                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-blue-500 inline-block" />
                        Directory Management
                    </p>
                    <h1 className="text-5xl font-black tracking-tighter text-white">
                        Manage Members
                    </h1>
                    <p className="text-gray-500 font-medium">
                        View details and control roles for Mentron's community.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex p-1.5 glass rounded-2xl border-white/5 bg-white/5 self-start">
                    <button
                        onClick={() => setViewMode('member')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'member' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        <User size={14} />
                        Members
                    </button>
                    <button
                        onClick={() => setViewMode('exec')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'exec' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Shield size={14} />
                        Execom
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                    { label: 'Total Registrations', value: allMembers.length, icon: '👥' },
                    { label: 'Active Execom', value: allMembers.filter((m) => m.role === 'exec' || m.role === 'core').length, icon: '⭐' },
                    { label: 'Normal Students', value: allMembers.filter((m) => m.role === 'member').length, icon: '🎓' },
                    { 
                        label: 'Leadership Board', 
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

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-10 bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-md">
                <div className="flex-1 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search name, roll no, department, position..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-8 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold tracking-tight"
                    />
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                        <select
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-10 pr-6 py-4 text-xs font-bold text-white outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/50"
                        >
                            {departments.map(d => <option key={d} value={d} className="bg-gray-900 text-white">{d === 'All' ? 'All Departments' : d}</option>)}
                        </select>
                    </div>
                    <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/50"
                    >
                        {years.map(y => <option key={y} value={y} className="bg-gray-900 text-white">{y === 'All' ? 'All Years' : `Year ${y}`}</option>)}
                    </select>
                </div>
            </div>

            {/* Results Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px]">Loading Identity Records...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 glass rounded-3xl border border-dashed border-white/10 mx-auto max-w-lg">
                    <div className="text-5xl mb-6 opacity-20">📇</div>
                    <p className="text-gray-400 font-black uppercase text-xs tracking-widest">No entries found in {viewMode} directory.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {filtered.map((m) => (
                        <div key={m.id} className="glass-card flex flex-col group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-900/30 hover:-translate-y-2 hover:border-blue-500/40">
                            
                            {/* Card Background Accent */}
                            <div className={`absolute -top-16 -right-16 w-40 h-40 opacity-10 blur-3xl rounded-full transition-all group-hover:scale-150 duration-700 ${m.role === 'core' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                            
                            <div className="flex items-start justify-between mb-8 z-10 relative">
                                <div className="flex gap-4 items-center">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-2xl transition-transform group-hover:scale-110 ${m.role === 'core' ? 'bg-gradient-to-br from-purple-600 to-fuchsia-800' : 'bg-gradient-to-br from-blue-600 to-indigo-800'}`}>
                                        {m.full_name?.[0]?.toUpperCase() ?? '?'}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-black text-white leading-tight capitalize truncate pr-2" title={m.full_name}>{m.full_name || 'Unknown'}</h3>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase border ${roleStyle(m)}`}>
                                                {m.role || 'Member'}
                                            </span>
                                            {m.iste_position && (
                                                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest truncate">{m.iste_position}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Display Info */}
                            <div className="space-y-4 flex-1 z-10 mb-8 bg-white/[0.03] p-5 rounded-[2rem] border border-white/5 backdrop-blur-sm group-hover:bg-white/[0.05] transition-colors">
                                <div className="flex items-center justify-between">
                                    <span className="text-[8px] text-gray-500 font-black tracking-[0.2em] uppercase">Roll No.</span>
                                    <span className="text-white font-bold text-xs tracking-wider">{m.roll_number || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[8px] text-gray-500 font-black tracking-[0.2em] uppercase">Department</span>
                                    <span className="text-white font-bold text-xs text-right truncate pl-4">{m.department || '—'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[8px] text-gray-500 font-black tracking-[0.2em] uppercase">Year</span>
                                    <span className={`font-black text-xs px-2 py-0.5 rounded-lg border ${m.year == 4 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'}`}>
                                        Year {m.year || '?'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2.5 mt-auto z-10 pt-4 border-t border-white/10">
                                {/* Promote/Demote Toggle - requires special permission */}
                                {canPromoteDemote && (
                                    <>
                                        {m.role === 'member' ? (
                                            <button
                                                disabled={updating === m.id}
                                                onClick={() => handleRoleChange(m.id, 'exec')}
                                                className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-[0.15em] transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                {updating === m.id ? '...' : <><Star size={10} fill="currentColor" /> Promote</>}
                                            </button>
                                        ) : (
                                            <button
                                                disabled={updating === m.id || m.role === 'core'} // Core roles protected, demote to member if exec
                                                onClick={() => handleRoleChange(m.id, 'member')}
                                                className={`flex-1 py-3.5 rounded-2xl transition-all disabled:opacity-30 active:scale-95 text-[9px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 ${m.role === 'core' ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
                                            >
                                                {updating === m.id ? '...' : 'Demote'}
                                            </button>
                                        )}
                                    </>
                                )}
                                
                                {/* Delete Action - Leadership or special delete permission only */}
                                {(isLeadership || userPermissions?.can_delete_account) && (
                                    <button
                                        disabled={updating === m.id || m.role === 'core'} // Protect core members from deletion here
                                        onClick={() => handleDeleteUser(m.id, m.full_name)}
                                        className={`w-14 flex items-center justify-center rounded-2xl transition-all active:scale-95 shadow-lg ${m.role === 'core' ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-white/5' : 'bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 shadow-red-500/10'}`}
                                        title="Delete Account"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Toast Notifications */}
            {toast && (
                <div
                    className={`fixed bottom-10 right-10 px-8 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all z-[2000] animate-in slide-in-from-right duration-500 border backdrop-blur-xl ${
                        toast.ok ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10' : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/10'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                        {toast.msg}
                    </div>
                </div>
            )}
        </div>
    )
}
