'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, ArrowRight, BookOpen, Layers, Sparkles } from 'lucide-react'
import { AddDepartmentModal } from './AddDepartmentModal'

export interface Department {
    id: string
    key: string
    label: string
    emoji?: string | null
    color?: string | null
    created_at?: string
    gate_folders?: { id: string }[]
}

interface Props {
    initialDepartments: Department[]
    isPrivileged: boolean
}

const COLOR_MAP: Record<string, { border: string; glow: string; text: string; bg: string; badge: string }> = {
    cyan: {
        border: 'border-cyan-500/30 hover:border-cyan-400/60',
        glow: 'group-hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]',
        text: 'text-cyan-400',
        bg: 'from-cyan-500/10 to-sky-500/5',
        badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
    },
    orange: {
        border: 'border-orange-500/30 hover:border-orange-400/60',
        glow: 'group-hover:shadow-[0_0_30px_rgba(249,115,22,0.25)]',
        text: 'text-orange-400',
        bg: 'from-orange-500/10 to-amber-500/5',
        badge: 'bg-orange-500/10 text-orange-300 border-orange-500/30'
    },
    purple: {
        border: 'border-purple-500/30 hover:border-purple-400/60',
        glow: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.25)]',
        text: 'text-purple-400',
        bg: 'from-purple-500/10 to-violet-500/5',
        badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30'
    },
    blue: {
        border: 'border-blue-500/30 hover:border-blue-400/60',
        glow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]',
        text: 'text-blue-400',
        bg: 'from-blue-500/10 to-indigo-500/5',
        badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30'
    },
    emerald: {
        border: 'border-emerald-500/30 hover:border-emerald-400/60',
        glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.25)]',
        text: 'text-emerald-400',
        bg: 'from-emerald-500/10 to-teal-500/5',
        badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
    },
    rose: {
        border: 'border-rose-500/30 hover:border-rose-400/60',
        glow: 'group-hover:shadow-[0_0_30px_rgba(244,63,94,0.25)]',
        text: 'text-rose-400',
        bg: 'from-rose-500/10 to-pink-500/5',
        badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30'
    },
}

export function GateLandingClient({ initialDepartments, isPrivileged }: Props) {
    const [departments, setDepartments] = useState<Department[]>(initialDepartments)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    const handleCreated = (dept: Department) => {
        setDepartments(prev => {
            const exists = prev.some(d => d.id === dept.id || d.key === dept.key)
            if (exists) return prev
            return [...prev, { ...dept, gate_folders: [] }]
        })
    }

    return (
        <div className="min-h-screen pt-20 sm:pt-28 md:pt-32 p-4 sm:p-6 md:p-8 text-[#ededed]">
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/10">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase tracking-[0.25em]">
                            <Sparkles size={12} className="text-cyan-400 animate-pulse" />
                            Direct Academic Portals
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                            Mentron Gate Initiative
                        </h1>
                        <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
                            A streamlined, flat archive of curated notes organized directly by department and subject folder. No year or semester barriers.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/notes"
                            className="text-xs font-bold text-gray-400 hover:text-white transition-all uppercase tracking-wider px-4 py-2 rounded-xl hover:bg-white/5"
                        >
                            Standard Library
                        </Link>
                        {isPrivileged && (
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(0,198,255,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            >
                                <Plus size={16} />
                                Add Department
                            </button>
                        )}
                    </div>
                </header>

                {/* Department Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments.map((dept, index) => {
                        const styling = COLOR_MAP[dept.color || 'cyan'] || COLOR_MAP.cyan
                        const folderCount = dept.gate_folders?.length ?? 0

                        return (
                            <motion.div
                                key={dept.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.08, duration: 0.4 }}
                            >
                                <Link
                                    href={`/gate/${dept.key}`}
                                    className={`group block h-full p-8 rounded-3xl bg-gradient-to-br ${styling.bg} glass-card border ${styling.border} ${styling.glow} transition-all duration-300 relative overflow-hidden`}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="text-4xl filter drop-shadow-md">
                                            {dept.emoji || '🏛️'}
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider border ${styling.badge}`}>
                                            {dept.key}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-8">
                                        <h2 className="text-2xl font-black text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                                            {dept.label}
                                        </h2>
                                        <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                                            <Layers size={13} className={styling.text} />
                                            <span>{folderCount} {folderCount === 1 ? 'Subject Folder' : 'Subject Folders'}</span>
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-gray-400 group-hover:text-white transition-colors">
                                        <span className="uppercase tracking-widest text-[10px]">Open Portal</span>
                                        <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform text-cyan-400" />
                                    </div>
                                </Link>
                            </motion.div>
                        )
                    })}
                </div>

                {departments.length === 0 && (
                    <div className="text-center py-20 glass-card rounded-3xl border-white/10 p-12">
                        <p className="text-gray-400 text-sm mb-4">No departments initialized yet.</p>
                        {isPrivileged && (
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider hover:bg-cyan-500/30 transition-all cursor-pointer"
                            >
                                <Plus size={16} />
                                Create First Department
                            </button>
                        )}
                    </div>
                )}
            </div>

            <AddDepartmentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onCreated={handleCreated}
            />
        </div>
    )
}
