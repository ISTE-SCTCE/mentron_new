'use client'

import { useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'

interface Props {
    isOpen: boolean
    onClose: () => void
    subjectName: string
    department: string
    year: string
    semester: string
    onCreated: (folder: { id: string; name: string }) => void
    isPrivileged: boolean
}

export function CreateNoteFolderModal({
    isOpen,
    onClose,
    subjectName,
    department,
    year,
    semester,
    onCreated,
    isPrivileged,
}: Props) {
    const [name, setName] = useState('')
    const [requiresAuth, setRequiresAuth] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const trimmed = name.trim()
        if (!trimmed) { setError('Please enter a folder name.'); return }
        setError('')
        setIsLoading(true)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not logged in')

            // Check for duplicate
            const { data: existing } = await supabase
                .from('note_folders')
                .select('id')
                .eq('subject', subjectName)
                .eq('department', department)
                .eq('year', year)
                .eq('semester', semester)
                .ilike('name', trimmed)
                .maybeSingle()

            if (existing) {
                setError('A folder with this name already exists for this subject.')
                setIsLoading(false)
                return
            }

            const { data, error: insertErr } = await supabase
                .from('note_folders')
                .insert({
                    name: trimmed,
                    subject: subjectName,
                    department,
                    year,
                    semester,
                    created_by: user.id,
                    requires_auth: requiresAuth,
                })
                .select('id, name')
                .single()

            if (insertErr) throw insertErr
            onCreated(data as { id: string; name: string })
            setName('')
            setRequiresAuth(false)
            onClose()
        } catch (err: any) {
            setError(err.message || 'Something went wrong.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div
                className="relative z-10 w-full max-w-md glass rounded-3xl p-8 border border-white/10 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="mb-6">
                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase mb-2">New Folder</p>
                    <h2 className="text-2xl font-black text-white">Create Folder</h2>
                    <p className="text-gray-500 text-xs mt-1 truncate">
                        Inside: <span className="text-blue-400 font-bold">{subjectName}</span>
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase block">
                            Folder Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Module 1, Unit 2, Lab Reports..."
                            autoFocus
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                        />
                        <p className="text-gray-600 text-xs">
                            Notes placed in this folder will only appear inside it.
                        </p>
                    </div>

                    {isPrivileged && (
                        <div className="space-y-1.5 flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                            <div>
                                <label className="text-xs font-black tracking-widest text-gray-300 uppercase cursor-pointer select-none block">
                                    Requires ISTE ID
                                </label>
                                <p className="text-[10px] text-pink-500/70 font-bold uppercase tracking-widest mt-0.5">
                                    Enforce authorization for this folder
                                </p>
                            </div>
                            <div 
                                onClick={() => setRequiresAuth(!requiresAuth)}
                                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${requiresAuth ? 'bg-pink-600' : 'bg-gray-700'}`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${requiresAuth ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-gray-500 hover:text-white border border-white/10 hover:border-white/20 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-all"
                        >
                            {isLoading ? 'Creating...' : '📁 Create Folder'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
