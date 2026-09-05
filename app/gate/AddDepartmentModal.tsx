'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Building2, Sparkles } from 'lucide-react'
import { createGateDepartment } from './actions'

interface Props {
    isOpen: boolean
    onClose: () => void
    onCreated: (dept: any) => void
}

const COLOR_OPTIONS = [
    { label: 'Cyan', value: 'cyan', border: 'border-cyan-500/30', bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
    { label: 'Purple', value: 'purple', border: 'border-purple-500/30', bg: 'bg-purple-500/20', text: 'text-purple-400' },
    { label: 'Orange', value: 'orange', border: 'border-orange-500/30', bg: 'bg-orange-500/20', text: 'text-orange-400' },
    { label: 'Blue', value: 'blue', border: 'border-blue-500/30', bg: 'bg-blue-500/20', text: 'text-blue-400' },
    { label: 'Emerald', value: 'emerald', border: 'border-emerald-500/30', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    { label: 'Rose', value: 'rose', border: 'border-rose-500/30', bg: 'bg-rose-500/20', text: 'text-rose-400' },
]

export function AddDepartmentModal({ isOpen, onClose, onCreated }: Props) {
    const [key, setKey] = useState('')
    const [label, setLabel] = useState('')
    const [emoji, setEmoji] = useState('🏛️')
    const [color, setColor] = useState('cyan')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        const formData = new FormData()
        formData.append('key', key)
        formData.append('label', label)
        formData.append('emoji', emoji)
        formData.append('color', color)

        try {
            const res = await createGateDepartment(formData)
            if (res.error) {
                setError(res.error)
            } else if (res.department) {
                onCreated(res.department)
                onClose()
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create department.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', duration: 0.3 }}
                    className="relative w-full max-w-lg glass-card border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
                >
                    {/* Background glow accent */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <Building2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight">Add Department</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mentron Gate Initiative</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1 space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-300">Code</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. CSE"
                                    value={key}
                                    onChange={e => setKey(e.target.value.toUpperCase())}
                                    maxLength={10}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                                />
                            </div>
                            <div className="col-span-1 space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-300">Emoji</label>
                                <input
                                    type="text"
                                    value={emoji}
                                    onChange={e => setEmoji(e.target.value)}
                                    maxLength={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-center text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                                />
                            </div>
                            <div className="col-span-1 space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-300">Theme</label>
                                <select
                                    value={color}
                                    onChange={e => setColor(e.target.value)}
                                    className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                                >
                                    {COLOR_OPTIONS.map(c => (
                                        <option key={c.value} value={c.value} className="bg-[#111] text-white">
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-gray-300">Full Department Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Computer Science & Engineering"
                                value={label}
                                onChange={e => setLabel(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                            />
                        </div>

                        <div className="pt-2 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(0,198,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? 'Saving...' : 'Add Department'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
