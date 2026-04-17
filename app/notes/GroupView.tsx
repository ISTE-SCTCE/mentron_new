'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CreateGroupModal, CustomGroupData } from '../components/CreateGroupModal'

interface Group {
    id: string
    title: string
    deptCode: string
    year: number
    description: string
}

const DEPARTMENTS = [
    { code: 'CSE', name: 'Computer Science & Engineering' },
    { code: 'ECE', name: 'Electronics and Communication Engineering' },
    { code: 'ME', name: 'Mechanical Engineering' },
    { code: 'MEA', name: 'Automobile Engineering' },
    { code: 'BT', name: 'Bio Technology' },
]

export function GroupView({ userDepartment, currentDept, currentYear, groupCounts = {} }: { userDepartment: string, userRole?: string, currentDept?: string, currentYear?: string, groupCounts?: Record<string, number> }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [customGroups, setCustomGroups] = useState<CustomGroupData[]>([])

    // Generate all groups dynamically
    const groups: Group[] = []

    DEPARTMENTS.forEach(dept => {
        for (let year = 1; year <= 4; year++) {
            groups.push({
                id: `${dept.code}-${year}`,
                title: dept.name,
                deptCode: dept.code,
                year: year,
                description: `Default group for ${dept.name}, Year ${year}`
            })
        }
    })



    // If a specific group is selected, we might want to hide this view or make it smaller.
    // For now, if a group is selected, we will collapse or just show a back button.
    if (currentDept && currentYear) {
        return (
            <div className="mb-8">
                <Link href="/notes" className="text-gray-500 hover:text-white transition-all text-sm font-bold uppercase tracking-widest inline-flex items-center gap-2">
                    ← Back to All Groups
                </Link>
                <div className="mt-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl">
                        👥
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">{DEPARTMENTS.find(d => d.code === currentDept)?.name || currentDept}</h2>
                        <p className="text-gray-500 text-sm font-medium">{currentDept} • Year {currentYear}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="mt-8 md:mt-12">
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Group Management</h2>
                    <p className="text-blue-400 text-sm mt-1">Manage groups and drag students to assign</p>
                </div>
                <button
                    className="bg-[#0ba5e9] hover:bg-[#0284c7] text-white px-6 py-2.5 rounded-full text-sm font-bold transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                    onClick={() => setIsModalOpen(true)}
                >
                    <span className="text-lg">+</span> Create Group
                </button>
            </div>

            <div className="flex gap-2 md:gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide w-full max-w-full">
                <button className="bg-[#0ba5e9] text-white px-4 md:px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(11,165,233,0.3)] whitespace-nowrap shrink-0">
                    👥 Groups
                </button>
                <button className="text-gray-400 hover:text-white px-4 md:px-5 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0">
                    👤 Student Assignment
                </button>
                <button className="text-gray-400 hover:text-white px-4 md:px-5 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0">
                    🏢 Hierarchy
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

                {/* Dynamic Department Cards - Show all but highlight matching */}
                {groups.map(group => {
                    const isUserDept = userDepartment === group.deptCode
                    const isActive = currentDept === group.deptCode && currentYear === group.year.toString()
                    const noteCount = groupCounts[`${group.deptCode}-${group.year}`] || 0

                    return (
                        <Link
                            href={`/notes?dept=${group.deptCode}&year=${group.year}`}
                            key={group.id}
                            className={`bg-[#0a0a0a] border ${isActive ? 'border-[#0ba5e9]' : 'border-[#1f2937]'} p-6 rounded-2xl flex items-center gap-4 transition-all hover:border-[#374151] group/card`}
                        >
                            <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#082f49] flex items-center justify-center text-[#0ba5e9]">
                                👥
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-base font-bold text-white leading-tight mb-1 truncate pr-2">
                                        {group.title}
                                    </h3>
                                    <span className={`w-6 h-6 shrink-0 rounded-full text-xs font-bold flex items-center justify-center border 
                                        ${noteCount > 0 ? 'bg-[#064e3b] text-[#10b981] border-[#047857]' : 'bg-[#1f2937] text-gray-500 border-gray-700'}
                                    `}>
                                        {noteCount}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mb-1 text-xs">
                                    <span className="text-[#9ca3af]">{group.deptCode} • Year {group.year}</span>
                                    {isUserDept && (
                                        <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-tighter animate-pulse">
                                            Your Dept
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-[#0ea5e9]/70 truncate">
                                    {group.description}
                                </p>
                            </div>
                            <div className="text-[#4b5563] group-hover/card:text-white transition-colors ml-2">›</div>
                        </Link>
                    )
                })}

                {/* Custom Highlighted Groups */}
                {customGroups.map((group, idx) => {
                    // Custom groups are universally accessible for now to show off the UI

                    const isActive = currentDept === group.deptCode && currentYear === group.year
                    const memberCount = 1

                    return (
                        <Link
                            href={`/notes?dept=${group.deptCode}&year=${group.year !== 'All Years' ? group.year : 'All'}`}
                            key={`custom-${idx}`}
                            className={`bg-[#0a0a0a] border ${isActive ? 'border-white' : 'border-[#1f2937]'} p-6 rounded-2xl flex items-center gap-4 transition-all hover:border-[#374151] group/card`}
                        >
                            <div className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: group.color }}>
                                👥
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-base font-bold text-white leading-tight mb-1 truncate pr-2">
                                        {group.title}
                                    </h3>
                                    <span className="w-6 h-6 shrink-0 rounded-full bg-[#1e293b] text-white text-xs font-bold flex items-center justify-center border border-[#334155]">
                                        {memberCount}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mb-1 text-xs">
                                    <span className="text-[#9ca3af]">{group.deptCode} • Year {group.year}</span>
                                </div>
                                <p className="text-[11px] text-gray-400 truncate">
                                    {group.description || 'Custom created group'}
                                </p>
                            </div>
                            <div className="text-[#4b5563] group-hover/card:text-white transition-colors ml-2">›</div>
                        </Link>
                    )
                })}
            </div>

            <CreateGroupModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={(data) => setCustomGroups([...customGroups, data])}
            />
        </div>
    )
}
