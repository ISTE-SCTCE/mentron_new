'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CreateNoteFolderModal } from '@/app/components/CreateNoteFolderModal'

interface Folder {
    id: string
    name: string
}

interface Props {
    subjectName: string
    department: string
    year: string
    semester: string
    initialFolders: Folder[]
    canCreateFolder: boolean
    styleAccent: string
    styleBorder: string
    yearNum: number
    deptKey: string
    semKey: string
    isPrivileged: boolean
    title?: string
    hideFolderList?: boolean
}

export function SubjectFoldersClient({
    subjectName,
    department,
    year,
    semester,
    initialFolders,
    canCreateFolder,
    styleAccent,
    styleBorder,
    yearNum,
    deptKey,
    semKey,
    isPrivileged,
    title,
    hideFolderList
}: Props) {
    const [folders, setFolders] = useState<Folder[]>(initialFolders)
    const [showCreateModal, setShowCreateModal] = useState(false)

    const encodedSubject = encodeURIComponent(subjectName)

    const handleDelete = async (e: React.MouseEvent, folderId: string) => {
        e.preventDefault()
        e.stopPropagation()
        if (!confirm('Are you sure you want to delete this folder?')) return

        try {
            const res = await fetch(`/api/folders/${folderId}`, { method: 'DELETE' })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to delete')
            setFolders(prev => prev.filter(f => f.id !== folderId))
        } catch (err: any) {
            alert(err.message)
        }
    }

    const handleEdit = async (e: React.MouseEvent, folder: Folder) => {
        e.preventDefault()
        e.stopPropagation()
        const newName = prompt('Enter new folder name:', folder.name)
        if (!newName || newName.trim() === '' || newName === folder.name) return

        try {
            const res = await fetch(`/api/folders/${folder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim() })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to rename')
            setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, name: newName.trim() } : f))
        } catch (err: any) {
            alert(err.message)
        }
    }

    return (
        <>
            {/* Custom Folders Section */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className={`text-[10px] font-black tracking-[0.3em] uppercase ${styleAccent} flex items-center gap-2`}>
                            <span className="w-6 h-[1px] bg-current inline-block" />
                            {title || 'Custom Folders'}
                        </p>
                    </div>
                    {canCreateFolder && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${styleAccent} glass glass-hover px-4 py-2 rounded-full border ${styleBorder} hover:scale-105 transition-all`}
                        >
                            <span className="text-base">+</span> New Folder
                        </button>
                    )}
                </div>

                {!hideFolderList && (
                    folders.length === 0 ? (
                        canCreateFolder ? (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className={`w-full glass-card border border-dashed ${styleBorder} py-8 text-center hover:bg-white/5 transition-all group`}
                            >
                                <p className="text-3xl mb-2 group-hover:scale-110 transition-transform">📁</p>
                                <p className="text-gray-600 font-bold text-xs uppercase tracking-widest">
                                    Create your first folder for this subject
                                </p>
                            </button>
                        ) : (
                            <p className="text-gray-700 text-xs font-bold uppercase tracking-widest">
                                No custom folders yet
                            </p>
                        )
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {folders.map(folder => (
                                <Link
                                    key={folder.id}
                                    href={yearNum === 1 
                                        ? `/notes/year/1/group/${deptKey}/${semKey}/${encodedSubject}/folder/${folder.id}`
                                        : `/notes/year/${yearNum}/dept/${deptKey}/${semKey}/${encodedSubject}/folder/${folder.id}`
                                    }
                                    className={`glass-card flex items-center gap-4 group hover:bg-white/5 transition-all border ${styleBorder}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shrink-0`}>
                                        📁
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-black text-white truncate">{folder.name}</h3>
                                        <p className={`text-[10px] font-black tracking-widest uppercase ${styleAccent} opacity-60`}>
                                            Custom Folder
                                        </p>
                                    </div>
                                    {canCreateFolder && (
                                        <div className="flex items-center gap-1 mr-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => handleEdit(e, folder)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all text-xs" title="Edit Name">✏️</button>
                                            <button onClick={(e) => handleDelete(e, folder.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-all text-xs" title="Delete Folder">🗑️</button>
                                        </div>
                                    )}
                                    <span className="text-gray-600 group-hover:text-white transition-colors">›</span>
                                </Link>
                            ))}
                            {canCreateFolder && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className={`glass-card flex items-center gap-4 group hover:bg-white/5 transition-all border border-dashed ${styleBorder} opacity-50 hover:opacity-100`}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl shrink-0">
                                        ➕
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-black text-gray-400">New Folder</h3>
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-600">Click to create</p>
                                    </div>
                                </button>
                            )}
                        </div>
                    )
                )}
            </div>

            {showCreateModal && (
                <CreateNoteFolderModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    subjectName={subjectName}
                    department={department}
                    year={year}
                    semester={semester}
                    onCreated={(folder) => {
                        setFolders(prev => [...prev, folder])
                        setShowCreateModal(false)
                    }}
                    isPrivileged={isPrivileged}
                />
            )}
        </>
    )
}
