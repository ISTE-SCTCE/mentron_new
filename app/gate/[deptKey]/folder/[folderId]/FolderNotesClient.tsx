'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, ArrowLeft, Download, Trash2, Plus, Calendar, User, ExternalLink, Sparkles } from 'lucide-react'
import { GateUploadModal } from './GateUploadModal'
import { deleteGateNote } from '@/app/lib/actions/deleteActions'

interface GateNoteItem {
    id: string
    title: string
    description?: string | null
    file_url: string
    profile_id?: string | null
    created_at: string
    profiles?: { full_name: string | null } | null
}

interface Props {
    deptKey: string
    folderId: string
    folderName: string
    initialNotes: GateNoteItem[]
    canUploadNotes: boolean
    isPrivileged: boolean
    currentUserId: string | null
}

export function FolderNotesClient({
    deptKey,
    folderId,
    folderName,
    initialNotes,
    canUploadNotes,
    isPrivileged,
    currentUserId,
}: Props) {
    const [notes, setNotes] = useState<GateNoteItem[]>(initialNotes)
    const [isUploadOpen, setIsUploadOpen] = useState(false)

    const handleNoteUploaded = (newNote: GateNoteItem) => {
        setNotes(prev => [newNote, ...prev])
    }

    const handleDeleteNote = async (noteId: string, title: string) => {
        if (!confirm(`Are you sure you want to delete the note "${title}"?`)) return

        try {
            const res = await deleteGateNote(noteId)
            if (res.error) {
                alert(res.error)
            } else {
                setNotes(prev => prev.filter(n => n.id !== noteId))
            }
        } catch (err: any) {
            alert(err.message || 'Failed to delete note.')
        }
    }

    return (
        <div className="min-h-screen pt-20 sm:pt-28 md:pt-32 p-4 sm:p-6 md:p-8 text-[#ededed]">
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Header and Breadcrumbs */}
                <header className="space-y-6 pb-6 border-b border-white/10">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                        <Link href="/gate" className="hover:text-white transition-colors">
                            Gate Initiative
                        </Link>
                        <span className="text-gray-600">/</span>
                        <Link href={`/gate/${deptKey}`} className="hover:text-white transition-colors text-cyan-400">
                            {deptKey}
                        </Link>
                        <span className="text-gray-600">/</span>
                        <span className="text-white truncate max-w-xs">{folderName}</span>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <Link
                                    href={`/gate/${deptKey}`}
                                    className="p-2.5 rounded-2xl glass-card border border-white/10 text-gray-400 hover:text-white hover:border-cyan-500/30 transition-all"
                                >
                                    <ArrowLeft size={18} />
                                </Link>
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                                        {folderName}
                                    </h1>
                                    <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider">
                                        {deptKey} Department Notes
                                    </p>
                                </div>
                            </div>
                        </div>

                        {canUploadNotes && (
                            <button
                                onClick={() => setIsUploadOpen(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(0,198,255,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                            >
                                <Plus size={16} />
                                Upload Note
                            </button>
                        )}
                    </div>
                </header>

                {/* Notes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notes.map((note, index) => {
                        const canDelete = isPrivileged || note.profile_id === currentUserId
                        const formattedDate = new Date(note.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        })

                        return (
                            <motion.div
                                key={note.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.35 }}
                                className="group p-6 rounded-3xl glass-card border border-white/10 hover:border-cyan-500/30 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                            <FileText size={24} />
                                        </div>

                                        {canDelete && (
                                            <button
                                                onClick={() => handleDeleteNote(note.id, note.title)}
                                                title="Delete note"
                                                className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-black text-white mb-2 line-clamp-2">
                                        {note.title}
                                    </h3>

                                    {note.description && (
                                        <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-3 font-normal">
                                            {note.description}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/10 mt-2">
                                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={12} />
                                            {formattedDate}
                                        </span>
                                        {note.profiles?.full_name && (
                                            <span className="flex items-center gap-1.5 truncate max-w-[130px]" title={note.profiles.full_name}>
                                                <User size={12} />
                                                {note.profiles.full_name}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <a
                                            href={note.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all hover:border-cyan-500/40"
                                        >
                                            <ExternalLink size={14} />
                                            View Note
                                        </a>
                                        <a
                                            href={note.file_url}
                                            download
                                            className="p-2.5 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 text-gray-300 hover:text-cyan-300 transition-all"
                                            title="Download"
                                        >
                                            <Download size={16} />
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {notes.length === 0 && (
                    <div className="text-center py-20 glass-card rounded-3xl border-white/10 p-12">
                        <FileText size={48} className="mx-auto text-gray-600 mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">No notes uploaded yet</h3>
                        <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                            Be the first to contribute academic notes or reference materials to this folder.
                        </p>
                        {canUploadNotes && (
                            <button
                                onClick={() => setIsUploadOpen(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(0,198,255,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            >
                                <Plus size={16} />
                                Upload First Note
                            </button>
                        )}
                    </div>
                )}
            </div>

            <GateUploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                folderId={folderId}
                folderName={folderName}
                deptKey={deptKey}
                onNoteUploaded={handleNoteUploaded}
            />
        </div>
    )
}
