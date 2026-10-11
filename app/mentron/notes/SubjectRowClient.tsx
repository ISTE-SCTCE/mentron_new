'use client'

import Link from 'next/link'
import { useState } from 'react'

interface SubjectRowProps {
    id: string
    name: string
    basePath: string
    noteCount: number
    style: { color: string; border: string; accent: string }
    idx: number
    isPrivileged: boolean
}

export function SubjectRowClient({ id, name, basePath, noteCount, style, idx, isPrivileged }: SubjectRowProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(name)
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleEdit() {
        if (!editName.trim() || editName.trim() === name) {
            setIsEditing(false)
            return
        }
        try {
            const res = await fetch(`/api/folders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName.trim() })
            })
            if (!res.ok) {
                const data = await res.json()
                alert(data.error || 'Failed to rename')
                setEditName(name)
            } else {
                window.location.reload()
            }
        } catch (err: any) {
            alert(err.message)
        }
        setIsEditing(false)
    }

    async function handleDelete() {
        if (!confirm(`Are you sure you want to delete the subject "${name}"?\nThis cannot be undone.`)) return
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' })
            if (!res.ok) {
                const data = await res.json()
                alert(data.error || 'Failed to delete subject')
            } else {
                window.location.reload()
            }
        } catch (err: any) {
            alert(err.message)
        }
        setIsDeleting(false)
    }

    if (isEditing) {
        return (
            <div className={`glass p-5 rounded-2xl flex items-center gap-4 border border-white/5`}>
                <span className={`w-8 h-8 shrink-0 rounded-xl ${style.color} border ${style.border} flex items-center justify-center text-[11px] font-black ${style.accent}`}>
                    {idx + 1}
                </span>
                <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
                    autoFocus
                    onKeyDown={e => {
                        if (e.key === 'Enter') handleEdit()
                        if (e.key === 'Escape') { setIsEditing(false); setEditName(name) }
                    }}
                />
                <button onClick={handleEdit} className="text-xs font-bold text-green-400 px-3 py-1 bg-green-500/10 rounded-lg hover:bg-green-500/20">Save</button>
                <button onClick={() => { setIsEditing(false); setEditName(name) }} className="text-xs font-bold text-gray-400 px-3 py-1 bg-white/5 rounded-lg hover:bg-white/10">Cancel</button>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Link
                href={`${basePath}/${encodeURIComponent(name)}`}
                className={`glass p-5 rounded-2xl flex items-center gap-4 border border-white/5 hover:border-white/15 group transition-all hover:bg-white/3 flex-1 flex-wrap`}
            >
                <span className={`w-8 h-8 shrink-0 rounded-xl ${style.color} border ${style.border} flex items-center justify-center text-[11px] font-black ${style.accent}`}>
                    {idx + 1}
                </span>
                <span className="text-sm text-white font-medium leading-snug flex-1 group-hover:text-glow transition-all">{name}</span>
                <div className="flex items-center gap-3 shrink-0">
                    {noteCount > 0 ? (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${style.color} border ${style.border} ${style.accent}`}>
                            {noteCount} note{noteCount !== 1 ? 's' : ''}
                        </span>
                    ) : (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/5 text-gray-600">
                            No notes
                        </span>
                    )}
                    <span className={`${style.accent} group-hover:translate-x-1 transition-transform`}>→</span>
                </div>
            </Link>

            {isPrivileged && (
                <div className="flex flex-col gap-2 shrink-0">
                    <button
                        onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                        className="w-10 h-9 flex items-center justify-center glass rounded-xl text-blue-400 hover:text-white hover:bg-blue-500/20 transition-all border border-blue-500/20"
                        title="Edit Subject"
                    >
                        ✎
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); handleDelete(); }}
                        disabled={isDeleting}
                        className="w-10 h-9 flex items-center justify-center glass rounded-xl text-red-400 hover:text-white hover:bg-red-500/20 transition-all border border-red-500/20 disabled:opacity-50"
                        title="Delete Subject"
                    >
                        🗑
                    </button>
                </div>
            )}
        </div>
    )
}
