'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Check, X, Search, User, Trash2, Upload, FileText, Star } from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import { motion } from 'framer-motion'

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
        <div className="min-h-screen pt-20 sm:pt-28 md:pt-32 pb-20 px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto text-[#ededed]">
            <Toaster position="bottom-right" />
            
            <header className="mb-8 sm:mb-12 space-y-3">
                <div className="flex items-center gap-3">
                    <Link href="/admin" className="text-[#8b9bb4] hover:text-white transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                        ← Admin Console
                    </Link>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <div className="px-3 py-1 glass rounded-full text-[9px] font-black tracking-widest text-purple-400 uppercase border border-purple-500/20 shadow-lg shadow-purple-500/5">
                        Leadership Board
                    </div>
                </div>
                <div className="space-y-1.5">
                    <p className="text-[10px] font-black tracking-[0.25em] text-purple-400 uppercase flex items-center gap-2">
                        <Shield size={13} />
                        Identity & Access Governance
                    </p>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-space-grotesk">
                        Permission Board
                    </h1>
                    <p className="text-sm sm:text-base text-[#8b9bb4] font-medium max-w-2xl">
                        Configure granular operational authority for Executive and Core team members.
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Member List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search leadership members by name, roll no, or position..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full glass bg-white/5 border border-white/10 rounded-2xl pl-13 pr-6 py-4 text-sm sm:text-base text-white placeholder:text-[#8b9bb4] focus:outline-none focus:border-purple-500/50 transition-all font-semibold tracking-tight shadow-xl"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[550px] lg:max-h-[650px] overflow-y-auto pr-1 sm:pr-3 custom-scrollbar">
                        {loading ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-8 h-8 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                                <p className="text-[#8b9bb4] font-black uppercase tracking-widest text-[10px]">Accessing Directory...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="col-span-full py-16 text-center glass-card rounded-2xl border-dashed border-white/10">
                                <p className="text-sm font-bold text-white mb-1">No matching leaders found</p>
                                <p className="text-xs text-[#8b9bb4]">Try adjusting your search query</p>
                            </div>
                        ) : filtered.map((member, idx) => (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.1 }}
                                transition={{ duration: 0.3, delay: idx * 0.04, ease: 'easeOut' }}
                            >
                            <button
                                onClick={() => setSelectedMember(member)}
                                className={`w-full glass glass-hover p-5 sm:p-6 rounded-2xl sm:rounded-3xl text-left transition-all relative overflow-hidden group/card shadow-lg ${selectedMember?.id === member.id ? 'border-purple-500/60 bg-purple-500/10 shadow-purple-500/10' : 'border-white/5'}`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-12 sm:w-14 h-12 sm:h-14 rounded-2xl flex items-center justify-center text-lg sm:text-xl font-black text-white group-hover/card:scale-105 transition-transform ${member.role === 'core' ? 'bg-gradient-to-br from-purple-600 to-indigo-700 shadow-purple-500/20' : 'bg-gradient-to-br from-cyan-600 to-blue-700 shadow-cyan-500/20'} shadow-xl`}>
                                        {member.full_name?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm sm:text-base font-bold text-white truncate">{member.full_name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">{member.role}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-700" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#8b9bb4] truncate">{member.iste_position || 'Member'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 flex-col sm:flex-row">
                                        {Object.values(member.permissions || {}).filter(v => v).map((_, i) => (
                                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                        ))}
                                    </div>
                                </div>
                            </button>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Permission Editor */}
                <div className="lg:col-start-3">
                    {selectedMember ? (
                        <div className="glass-card p-6 sm:p-8 rounded-3xl sticky top-28 sm:top-32 animate-in slide-in-from-right duration-500 border-purple-500/20 shadow-2xl">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600/20 to-cyan-600/20 flex items-center justify-center mx-auto mb-4 shadow-inner border border-white/10">
                                    <User size={36} className="text-purple-300" />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1 line-clamp-1">{selectedMember.full_name}</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b9bb4]">{selectedMember.roll_number}</p>
                                <div className="mt-3 flex justify-center gap-2">
                                    <span className="px-3 py-1 rounded-full bg-white/5 text-[9px] font-black text-purple-300 uppercase tracking-widest border border-white/10">
                                        {selectedMember.iste_position || 'Execom'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black tracking-widest text-[#8b9bb4] uppercase mb-3 border-b border-white/5 pb-2">Authority Switches</p>
                                {PERMISSION_METADATA.map(perm => {
                                    const Icon = perm.icon
                                    const isActive = selectedMember.permissions[perm.id as keyof typeof selectedMember.permissions]
                                    
                                    return (
                                        <div key={perm.id} className="flex items-center justify-between p-3.5 sm:p-4 glass rounded-2xl border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-xl bg-white/5 ${perm.color}`}>
                                                    <Icon size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-200 tracking-tight">{perm.label}</span>
                                                    <span className="text-[9px] text-[#8b9bb4] font-semibold uppercase tracking-tight">Access • {isActive ? 'Granted' : 'Restricted'}</span>
                                                </div>
                                            </div>
                                            <button
                                                disabled={isUpdating}
                                                onClick={() => handleUpdatePermission(perm.id, !isActive)}
                                                className={`w-12 h-6 rounded-full p-0.5 transition-all duration-300 relative shadow-inner ${isActive ? 'bg-purple-600 shadow-purple-500/30' : 'bg-gray-800'}`}
                                            >
                                                <div className={`w-5 h-5 rounded-full bg-white transition-all shadow-xl flex items-center justify-center ${isActive ? 'translate-x-6' : 'translate-x-0'}`}>
                                                    {isActive ? <Check size={10} className="text-purple-600 font-bold" /> : <X size={10} className="text-gray-400" />}
                                                </div>
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="mt-8 p-4 sm:p-5 glass rounded-2xl border-purple-500/20 bg-purple-500/[0.03] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Shield size={36} className="text-purple-400" />
                                </div>
                                <p className="text-[10px] text-purple-300 font-bold leading-relaxed text-center italic relative z-10">
                                    Leadership overrides are logged. Changes propagate across all platform sessions instantly.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card p-8 sm:p-12 rounded-3xl text-center border-dashed border-white/10 flex flex-col items-center justify-center min-h-[350px] lg:min-h-[500px] shadow-2xl">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-2xl mb-4 opacity-30 animate-pulse border border-white/10">
                                👤
                            </div>
                            <p className="text-[#8b9bb4] font-black uppercase tracking-[0.2em] text-[10px] max-w-[220px] leading-relaxed">
                                Select a leader from the directory to configure their granular access permissions
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
