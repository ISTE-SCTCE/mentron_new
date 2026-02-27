'use client'

import { useState } from 'react'

const COLORS = [
    '#0ba5e9', // Light Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#3b82f6', // Dark Blue
    '#10b981', // Green
    '#f97316', // Orange
    '#ef4444', // Red
    '#eab308'  // Yellow
]

export interface CustomGroupData {
    title: string;
    deptCode: string;
    year: string;
    description: string;
    color: string;
}

export function CreateGroupModal({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (data: CustomGroupData) => void }) {
    const [selectedColor, setSelectedColor] = useState(COLORS[0])
    const [title, setTitle] = useState('')
    const [deptCode, setDeptCode] = useState('CSE')
    const [year, setYear] = useState('All Years')
    const [description, setDescription] = useState('')

    if (!isOpen) return null

    const handleCreate = () => {
        if (!title.trim()) return; // rudimentary validation
        onSubmit({
            title,
            deptCode,
            year,
            description,
            color: selectedColor
        })

        // Reset form
        setTitle('')
        setDeptCode('CSE')
        setYear('All Years')
        setDescription('')
        setSelectedColor(COLORS[0])
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[9998] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-48 overflow-y-auto">
            <div className="bg-[#0a0a0a] border border-[#1f2937] w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Create New Group</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Group Name */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-300">Group Name <span className="text-[#ec4899]">*</span></label>
                        <input
                            type="text"
                            placeholder="e.g., Study Group A"
                            className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0ba5e9] transition-colors"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Department */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-300">Department <span className="text-[#ec4899]">*</span></label>
                        <select
                            className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0ba5e9]/50 transition-colors appearance-none"
                            value={deptCode}
                            onChange={(e) => setDeptCode(e.target.value)}
                        >
                            <option value="CSE" className="bg-[#0a0a0a] text-white">Computer Science & Engineering</option>
                            <option value="ECE" className="bg-[#0a0a0a] text-white">Electronics and Communication Engineering</option>
                            <option value="ME" className="bg-[#0a0a0a] text-white">Mechanical Engineering</option>
                            <option value="MEA" className="bg-[#0a0a0a] text-white">Automobile Engineering</option>
                            <option value="BT" className="bg-[#0a0a0a] text-white">Bio Technology</option>
                        </select>
                    </div>

                    {/* Year */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-300">Year (Optional)</label>
                        <select
                            className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0ba5e9]/50 transition-colors appearance-none"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        >
                            <option value="All Years" className="bg-[#0a0a0a] text-white">All Years</option>
                            <option value="1" className="bg-[#0a0a0a] text-white">Year 1</option>
                            <option value="2" className="bg-[#0a0a0a] text-white">Year 2</option>
                            <option value="3" className="bg-[#0a0a0a] text-white">Year 3</option>
                            <option value="4" className="bg-[#0a0a0a] text-white">Year 4</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-300">Description (Optional)</label>
                        <textarea
                            placeholder="Brief description..."
                            rows={3}
                            className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0ba5e9] transition-colors resize-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>
                    </div>

                    {/* Group Color */}
                    <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold text-gray-300">Group Color</label>
                        <div className="grid grid-cols-4 gap-3">
                            {COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    className={`h-10 rounded-full transition-transform ${selectedColor === color ? 'ring-2 ring-white scale-110' : 'hover:scale-105 opacity-80'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-full text-sm font-bold text-gray-300 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!title.trim()}
                        className="bg-[#1e1b4b] hover:bg-[#312e81] text-[#a5b4fc] px-6 py-2.5 rounded-full text-sm font-bold transition-colors shadow-[0_0_15px_rgba(49,46,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create Group
                    </button>
                </div>
            </div>
        </div>
    )
}
