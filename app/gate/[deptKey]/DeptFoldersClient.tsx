'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Folder, Plus, ArrowLeft, ArrowRight, Trash2, FileText, Search, Sparkles, X } from 'lucide-react'
import { createGateFolder } from '@/app/gate/actions'
import { deleteGateFolder } from '@/app/lib/actions/deleteActions'

interface GateFolderItem {
    id: string
    name: string
    created_at: string
    created_by: string | null
    gate_notes?: { id: string }[]
    profiles?: { full_name: string | null } | null
}

interface Department {
    id: string
    key: string
    label: string
    emoji?: string | null
    color?: string | null
}

interface Props {
    department: Department
    initialFolders: GateFolderItem[]
    canCreateFolder: boolean
    isPrivileged: boolean
    currentUserId: string | null
}

export function DeptFoldersClient({
    department,
    initialFolders,
    canCreateFolder,
    isPrivileged,
    currentUserId,
}: Props) {
    const [folders, setFolders] = useState<GateFolderItem[]>(initialFolders)
    const [searchQuery, setSearchQuery] = useState('')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)

    const filteredFolders = folders.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newFolderName.trim()) return
        setIsSubmitting(true)
        setActionError(null)

        try {
            const res = await createGateFolder(department.id, newFolderName)
            if (res.error) {
                setActionError(res.error)
            } else if (res.folder) {
                setFolders(prev => [...prev, { ...res.folder, gate_notes: [] }])
                setNewFolderName('')
                setIsCreateOpen(false)
            }
        } catch (err: any) {
            setActionError(err.message || 'Failed to create folder.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteFolder = async (e: React.MouseEvent, folderId: string, folderName: string) => {
        e.preventDefault()
        e.stopPropagation()

        if (!confirm(`Are you sure you want to delete the folder "${folderName}" and all notes inside it?`)) {
            return
        }

        try {
            const res = await deleteGateFolder(folderId)
            if (res.error) {
                alert(res.error)
            } else {
                setFolders(prev => prev.filter(f => f.id !== folderId))
            }
        } catch (err: any) {
            alert(err.message || 'Failed to delete folder.')
        }
    }

    return (
        <div className="min-h-screen pt-20 sm:pt-28 md:pt-32 p-4 sm:p-6 md:p-8 text-[#ededed]">
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Header Navigation */}
                <header className="space-y-6 pb-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/gate"
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={14} />
                            Gate Initiative
                        </Link>
                        <span className="text-gray-600">/</span>
                        <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                            {department.key}
                        </span>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{department.emoji || '🏛️'}</span>
                                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                                    {department.label}
                                </h1>
                            </div>
                            <p className="text-sm text-gray-400">
                                Curated subject and course folders. Select a folder to view or contribute notes.
                            </p>
                        </div>

                        {canCreateFolder && (
                            <button
                                onClick={() => setIsCreateOpen(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(0,198,255,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                            >
                                <Plus size={16} />
                                New Folder
                            </button>
                        )}
                    </div>

                    {/* Search bar */}
                    <div className="relative max-w-md">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Filter folders by subject name..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50"
                        />
                    </div>
                </header>

                {/* Folder Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFolders.map((folder, index) => {
                        const noteCount = folder.gate_notes?.length ?? 0
                        const canDelete = isPrivileged || folder.created_by === currentUserId

                        return (
                            <motion.div
                                key={folder.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.35 }}
                            >
                                <Link
                                    href={`/gate/${department.key}/folder/${folder.id}`}
                                    className="group block h-full p-6 rounded-3xl glass-card border border-white/10 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] transition-all duration-300 relative"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                                            <Folder size={24} />
                                        </div>

                                        {canDelete && (
                                            <button
                                                onClick={e => handleDeleteFolder(e, folder.id, folder.name)}
                                                title="Delete folder"
                                                className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-black text-white mb-2 group-hover:text-cyan-300 transition-colors line-clamp-2">
                                        {folder.name}
                                    </h3>

                                    <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-white/10">
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <FileText size={13} className="text-cyan-400" />
                                            {noteCount} {noteCount === 1 ? 'Note' : 'Notes'}
                                        </span>

                                        <div className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider text-cyan-400 group-hover:translate-x-1 transition-transform">
                                            <span>Open</span>
                                            <ArrowRight size={13} />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        )
                    })}
                </div>

                {filteredFolders.length === 0 && (
                    <div className="text-center py-20 glass-card rounded-3xl border-white/10 p-12">
                        <Folder size={48} className="mx-auto text-gray-600 mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">No folders found</h3>
                        <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                            {searchQuery ? 'No folders matched your filter query.' : 'There are no subject folders created in this department yet.'}
                        </p>
                        {canCreateFolder && (
                            <button
                                onClick={() => setIsCreateOpen(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider hover:bg-cyan-500/30 transition-all cursor-pointer"
                            >
                                <Plus size={16} />
                                Create First Folder
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Create Folder Modal */}
            <AnimatePresence>
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md glass-card border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                        <Folder size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white">Create New Folder</h3>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                            {department.key} — {department.label}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsCreateOpen(false)}
                                    className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {actionError && (
                                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center">
                                    {actionError}
                                </div>
                            )}

                            <form onSubmit={handleCreateFolder} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-300">
                                        Folder Name (e.g. Subject Name)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., Signals & Systems"
                                        value={newFolderName}
                                        onChange={e => setNewFolderName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                                        autoFocus
                                    />
                                </div>

                                <div className="pt-3 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateOpen(false)}
                                        disabled={isSubmitting}
                                        className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !newFolderName.trim()}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(0,198,255,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create Folder'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
