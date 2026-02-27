'use client'

import { useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function CreateProjectModal({ onClose }: { onClose: () => void }) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setError('Not authenticated.'); setSubmitting(false); return }

        const { error: insertErr } = await supabase
            .from('projects')
            .insert({ title: title.trim(), description: description.trim(), posted_by: user.id })

        setSubmitting(false)
        if (insertErr) { setError(insertErr.message); return }

        onClose()
        router.refresh()
    }

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg glass rounded-[2.5rem] p-8 border border-white/10 shadow-2xl">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase mb-1">New Listing</p>
                        <h2 className="text-2xl font-black text-white">Post a Project</h2>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl glass bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Project Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. AI Research Intern"
                            required
                            className="w-full glass bg-white/5 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe the project goals, skills needed, and duration..."
                            rows={5}
                            required
                            className="w-full glass bg-white/5 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                            <p className="text-red-400 text-xs font-bold">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-gray-600 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-widest transition-all active:scale-[0.98]"
                    >
                        {submitting ? 'Posting…' : 'Post Project'}
                    </button>
                </form>
            </div>
        </div>
    )
}
