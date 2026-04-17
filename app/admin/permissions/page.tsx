'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Check, X, Search, User, Trash2, Upload, FileText } from 'lucide-react'
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
    }
}

const PERMISSION_METADATA = [
    { id: 'can_see_member_info', label: 'See Member Info', icon: FileText, color: 'text-blue-400' },
    { id: 'can_delete_account', label: 'Delete Account', icon: Trash2, color: 'text-red-400' },
    { id: 'can_upload_notes', label: 'Upload Notes', icon: Upload, color: 'text-green-400' },
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
                can_upload_notes: true
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
            m.department?.toLowerCase().includes(q)
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
                    <div className="px-2 py-0.5 glass rounded-full text-[8px] font-black tracking-tighter text-blue-400 uppercase">Leadership Only</div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase flex items-center gap-2">
                        <Shield size={12} />
                        Access Control Management
                    </p>
                    <h1 className="text-5xl font-black tracking-tighter text-white">Permission Board</h1>
                    <p className="text-gray-500 font-medium">Manage granular access for Execom and Core members.</p>
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
                            className="w-full glass bg-white/5 border-white/10 rounded-[2rem] pl-16 pr-8 py-5 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-all font-bold tracking-tight"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px] overflow-y-auto pr-4 scrollbar-hide">
                        {loading ? (
                            <div className="col-span-full flex items-center justify-center py-20 text-gray-600 font-black uppercase tracking-widest text-xs">Loading Directory...</div>
                        ) : filtered.map(member => (
                            <button
                                key={member.id}
                                onClick={() => setSelectedMember(member)}
                                className={`glass glass-hover p-6 rounded-[2.5rem] text-left transition-all relative overflow-hidden group/card ${selectedMember?.id === member.id ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5'}`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-lg font-black text-white group-hover/card:scale-110 transition-transform">
                                        {member.full_name?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-black text-white truncate">{member.full_name}</h3>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-500/70">{member.role} • {member.iste_position || 'Member'}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        {Object.values(member.permissions).filter(v => v).map((_, i) => (
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
                        <div className="glass-card p-10 rounded-[3rem] sticky top-32 animate-in slide-in-from-right duration-500">
                            <div className="text-center mb-10">
                                <div className="w-20 h-20 rounded-[2rem] bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
                                    <User size={32} className="text-blue-500" />
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-tighter mb-1 line-clamp-1">{selectedMember.full_name}</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{selectedMember.roll_number}</p>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[9px] font-black tracking-widest text-gray-600 uppercase mb-4">Granular Permissions</p>
                                {PERMISSION_METADATA.map(perm => {
                                    const Icon = perm.icon
                                    const isActive = selectedMember.permissions[perm.id as keyof typeof selectedMember.permissions]
                                    
                                    return (
                                        <div key={perm.id} className="flex items-center justify-between p-4 glass rounded-2xl border-white/5 bg-white/2">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-xl bg-white/5 ${perm.color}`}>
                                                    <Icon size={16} />
                                                </div>
                                                <span className="text-xs font-bold text-gray-300">{perm.label}</span>
                                            </div>
                                            <button
                                                disabled={isUpdating}
                                                onClick={() => handleUpdatePermission(perm.id, !isActive)}
                                                className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative ${isActive ? 'bg-blue-600' : 'bg-white/10'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full bg-white transition-all shadow-lg ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="mt-10 p-6 glass rounded-[2rem] border-blue-500/10 bg-blue-500/5">
                                <p className="text-[9px] text-blue-400 font-bold leading-relaxed text-center opacity-70">
                                    Chairman and Vice Chairman have absolute control over these permissions. Changes take effect instantly for the member.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card p-12 rounded-[3rem] text-center border-dashed flex flex-col items-center justify-center min-h-[400px]">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-2xl mb-6 opacity-30">👥</div>
                            <p className="text-gray-500 font-black uppercase tracking-widest text-[9px] max-w-[200px] leading-loose">
                                Select a member from the directory to manage their individual permissions
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
