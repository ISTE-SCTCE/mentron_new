'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Check, X, Search, User, Trash2, Upload, FileText, Star } from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

type Profile = {
    id: string
    full_name: string
    roll_number: string
    department: string
    role: string
    iste_position: string
    permissions: {
        can_see_member_info: boolean
        can_delete_account: boolean
        can_upload_notes: boolean
        can_promote_demote: boolean
    }
}

const PERMISSION_METADATA = [
    { id: 'can_see_member_info', label: 'See Member Info', icon: FileText, color: 'text-blue-400' },
    { id: 'can_delete_account', label: 'Delete Account', icon: Trash2, color: 'text-red-400' },
    { id: 'can_upload_notes', label: 'Upload Notes', icon: Upload, color: 'text-green-400' },
    { id: 'can_promote_demote', label: 'Promote/Demote', icon: Star, color: 'text-amber-400' },
]

export default function PermissionControlPage() {
    const supabase = createClient()
    const router = useRouter()

    const [members, setMembers] = useState<Profile[]>([])
    const [filtered, setFiltered] = useState<Profile[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [selectedMember, setSelectedMember] = useState<Profile | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        async function checkAccess() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.replace('/login'); return }

            const { data: profile } = await supabase
                .from('profiles')
                .select('iste_position')
                .eq('id', user.id)
                .single()

            if (profile?.iste_position !== 'Chairman' && profile?.iste_position !== 'Vice Chairman') {
                router.replace('/dashboard')
            }
        }
        checkAccess()
    }, [supabase, router])

    const fetchMembers = useCallback(async () => {
        setLoading(true)
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, roll_number, department, role, iste_position, permissions')
            .in('role', ['core', 'exec'])
            .order('full_name', { ascending: true })

        const list = (data ?? []) as any[]
        const formattedList = list.map(m => ({
            ...m,
            permissions: m.permissions || {
                can_see_member_info: false,
                can_delete_account: false,
                can_upload_notes: true,
                can_promote_demote: false
            }
        }))
        setMembers(formattedList)
        setFiltered(formattedList)
        setLoading(false)
    }, [supabase])

    useEffect(() => { fetchMembers() }, [fetchMembers])

    useEffect(() => {
        const q = search.toLowerCase()
        setFiltered(members.filter(m => 
            m.full_name?.toLowerCase().includes(q) || 
            m.roll_number?.toLowerCase().includes(q) ||
            m.department?.toLowerCase().includes(q) ||
            m.iste_position?.toLowerCase().includes(q)
        ))
    }, [search, members])

    const handleUpdatePermission = async (permId: string, value: boolean) => {
        if (!selectedMember) return
        
        const newPermissions = { ...selectedMember.permissions, [permId]: value }
        
        if (!confirm(`Are you sure you want to ${value ? 'grant' : 'revoke'} '${PERMISSION_METADATA.find(p => p.id === permId)?.label}' permission for ${selectedMember.full_name}?`)) {
            return
        }

        setIsUpdating(true)
        try {
            const res = await fetch('/api/admin/update-permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    targetUserId: selectedMember.id, 
                    permissions: newPermissions 
                })
            })
            
            if (!res.ok) throw new Error('Failed to update')
            
            setMembers(prev => prev.map(m => 
                m.id === selectedMember.id ? { ...m, permissions: newPermissions } : m
            ))
            setSelectedMember({ ...selectedMember, permissions: newPermissions })
            toast.success("Permissions updated successfully!")
        } catch (e) {
            toast.error("Update failed")
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="min-h-screen pt-20 md:pt-32 pb-20 px-8 max-w-[1800px] mx-auto text-[#ededed]">
            <Toaster position="bottom-right" />
            
            <header className="mb-12 space-y-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="text-gray-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest">
                        ← Dashboard
                    </Link>
                    <div className="px-3 py-1 glass rounded-full text-[9px] font-black tracking-tighter text-blue-400 uppercase border border-blue-500/20 shadow-lg shadow-blue-500/5">Leadership Board</div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase flex items-center gap-2">
                        <Shield size={12} />
                        Identity & Access Management
                    </p>
                    <h1 className="text-5xl font-black tracking-tighter text-white">Permission Board</h1>
                    <p className="text-gray-500 font-medium">Configure granular authority for Executive and Core team members.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Member List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search leadership members..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full glass bg-white/5 border-white/10 rounded-[2.5rem] pl-16 pr-8 py-5 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-all font-bold tracking-tight shadow-2xl"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[650px] overflow-y-auto pr-4 custom-scrollbar">
                        {loading ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                <p className="text-gray-600 font-black uppercase tracking-widest text-[10px]">Accessing Directory...</p>
                            </div>
                        ) : filtered.map(member => (
                            <button
                                key={member.id}
                                onClick={() => setSelectedMember(member)}
                                className={`glass glass-hover p-6 rounded-[2.5rem] text-left transition-all relative overflow-hidden group/card shadow-lg ${selectedMember?.id === member.id ? 'border-blue-500/50 bg-blue-500/10 shadow-blue-500/5' : 'border-white/5'}`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white group-hover/card:scale-110 transition-transform ${member.role === 'core' ? 'bg-gradient-to-br from-purple-600 to-indigo-700 shadow-purple-500/20' : 'bg-gradient-to-br from-blue-600 to-cyan-700 shadow-blue-500/20'} shadow-xl`}>
                                        {member.full_name?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-black text-white truncate">{member.full_name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-500/70">{member.role}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-700" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 truncate">{member.iste_position || 'Member'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {Object.values(member.permissions || {}).filter(v => v).map((_, i) => (
                                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        ))}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Permission Editor */}
                <div className="lg:col-start-3">
                    {selectedMember ? (
                        <div className="glass-card p-10 rounded-[3.5rem] sticky top-32 animate-in slide-in-from-right duration-500 border-white/10 shadow-2xl">
                            <div className="text-center mb-10">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-blue-500/10 flex items-center justify-center mx-auto mb-6 shadow-inner border border-blue-500/10">
                                    <User size={40} className="text-blue-500" />
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-tighter mb-1 line-clamp-1">{selectedMember.full_name}</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{selectedMember.roll_number}</p>
                                <div className="mt-4 flex justify-center gap-2">
                                    <span className="px-3 py-1 rounded-full bg-white/5 text-[9px] font-black text-gray-400 uppercase tracking-widest border border-white/5">{selectedMember.iste_position || 'Execom'}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black tracking-widest text-gray-600 uppercase mb-4 border-b border-white/5 pb-2">Authority Switches</p>
                                {PERMISSION_METADATA.map(perm => {
                                    const Icon = perm.icon
                                    const isActive = selectedMember.permissions[perm.id as keyof typeof selectedMember.permissions]
                                    
                                    return (
                                        <div key={perm.id} className="flex items-center justify-between p-4 glass rounded-[1.5rem] border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 rounded-xl bg-white/5 ${perm.color}`}>
                                                    <Icon size={18} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-gray-200 uppercase tracking-wider">{perm.label}</span>
                                                    <span className="text-[8px] text-gray-600 font-bold uppercase tracking-tight">Access Level • {isActive ? 'Enabled' : 'Restricted'}</span>
                                                </div>
                                            </div>
                                            <button
                                                disabled={isUpdating}
                                                onClick={() => handleUpdatePermission(perm.id, !isActive)}
                                                className={`w-14 h-7 rounded-full p-1 transition-all duration-300 relative shadow-inner ${isActive ? 'bg-blue-600 shadow-blue-500/20' : 'bg-gray-800'}`}
                                            >
                                                <div className={`w-5 h-5 rounded-full bg-white transition-all shadow-xl flex items-center justify-center ${isActive ? 'translate-x-7' : 'translate-x-0'}`}>
                                                    {isActive ? <Check size={10} className="text-blue-600" /> : <X size={10} className="text-gray-400" />}
                                                </div>
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="mt-10 p-6 glass rounded-[2.5rem] border-blue-500/10 bg-blue-500/[0.03] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Shield size={40} className="text-blue-500" />
                                </div>
                                <p className="text-[10px] text-blue-400/80 font-bold leading-relaxed text-center italic relative z-10">
                                    Leadership overrides are logged. Changes reflect across all platform nodes instantly.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card p-12 rounded-[3.5rem] text-center border-dashed border-white/10 flex flex-col items-center justify-center min-h-[500px] shadow-2xl">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-3xl mb-8 opacity-20 animate-pulse ring-1 ring-white/10">👤</div>
                            <p className="text-gray-500 font-black uppercase tracking-[0.2em] text-[10px] max-w-[220px] leading-relaxed">
                                Select a member from the directory to configure their granular access tokens
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
