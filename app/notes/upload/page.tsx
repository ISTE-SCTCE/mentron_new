'use client'

import Link from 'next/link'
import { logout } from '@/app/login/actions'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useRef, useTransition, useEffect, useCallback } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { getPermissionsClient } from '@/app/lib/utils/coreAuthClient'
import {
    YEAR_SEMS,
    FIRST_YEAR_SUBJECTS,
    getSubjects,
    type GroupKey,
    type DeptKey,
    type SemKey,
} from '@/app/lib/data/subjects'

const DEPTS: { code: DeptKey; label: string }[] = [
    { code: 'CSE', label: 'Computer Science & Engineering' },
    { code: 'ECE', label: 'Electronics & Communication' },
    { code: 'ME',  label: 'Mechanical Engineering' },
    { code: 'MEA', label: 'Automobile Engineering' },
    { code: 'BT',  label: 'Biotechnology' },
]

const GROUPS: { code: GroupKey; label: string }[] = [
    { code: 'A', label: 'Group A — CS/IT streams' },
    { code: 'B', label: 'Group B — EEE/ECE streams' },
    { code: 'C', label: 'Group C — Mech/Civil streams' },
    { code: 'D', label: 'Group D — Biotech/Food Tech streams' },
]

export default function NotesUploadPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const error = searchParams.get('error')

    // Form state
    const [year, setYear] = useState('')
    const [sem, setSem] = useState('')
    const [group, setGroup] = useState<GroupKey | ''>('')   // Year 1 only
    const [dept, setDept] = useState<DeptKey | ''>('')      // Year 2-4
    const [subject, setSubject] = useState('')
    const [folderId, setFolderId] = useState('')
    const [folders, setFolders] = useState<{ id: string; name: string }[]>([])
    const [loadingFolders, setLoadingFolders] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
    const formRef = useRef<HTMLFormElement>(null)

    // Auth check
    useEffect(() => {
        async function checkAuth() {
            const perms = await getPermissionsClient()
            
            // Check if user is logged in (perms will be empty if not)
            if (Object.keys(perms).length === 0) {
                const { createClient } = await import('@/app/lib/supabase/client')
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }
            }

            if (!perms.can_upload_notes) {
                router.push('/notes?error=You do not have permission to upload notes.')
            } else {
                setIsAuthorized(true)
            }
        }
        checkAuth()
    }, [router])



    const yearNum = parseInt(year)
    const isFirstYear = yearNum === 1
    const semOptions: SemKey[] = year ? (YEAR_SEMS[yearNum] ?? []) : []

    // Build subject list depending on year
    const subjectList: string[] = (() => {
        if (!sem) return []
        let rawSubjects: string[] = []
        if (isFirstYear && group) {
            const s = FIRST_YEAR_SUBJECTS[group as GroupKey]?.[sem as 'S1' | 'S2'] ?? []
            rawSubjects = s.filter(sub => !sub.startsWith('— Electives:'))
        }
        else if (!isFirstYear && dept) {
            rawSubjects = (getSubjects(dept as DeptKey, sem as SemKey) ?? []).filter(s => !s.startsWith('— Electives:'))
        }

        const expandedSubjects: string[] = []
        for (const s of rawSubjects) {
            expandedSubjects.push(s)
            expandedSubjects.push(`PYQ - ${s}`)
            expandedSubjects.push(`Video - ${s}`)
        }
        return expandedSubjects
    })()

    const inputBase = 'w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium appearance-none'
    const labelBase = 'text-[10px] font-black tracking-widest text-gray-500 uppercase px-2 mb-2 block'

    // Pre-fill folder_id from URL if coming from a folder page
    useEffect(() => {
        const urlFolderId = searchParams.get('folder_id')
        if (urlFolderId) setFolderId(urlFolderId)
    }, [searchParams])

    // Load folders whenever subject + dept/group + sem + year are set
    const loadFolders = useCallback(async (subj: string, deptOrGroup: string, y: string, s: string) => {
        if (!subj || subj.startsWith('PYQ - ') || subj.startsWith('Video - ')) {
            setFolders([])
            setFolderId('')
            return
        }
        setLoadingFolders(true)
        try {
            const supabase = createClient()
            const { data } = await supabase
                .from('note_folders')
                .select('id, name')
                .eq('subject', subj)
                .eq('department', deptOrGroup)
                .eq('year', y)
                .eq('semester', s)
                .order('created_at', { ascending: true })
            setFolders(data ?? [])
        } catch {}
        setLoadingFolders(false)
    }, [])

    if (isAuthorized === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
                <div className="text-gray-500 font-black tracking-widest text-xs uppercase animate-pulse">
                    Verifying Permissions...
                </div>
            </div>
        )
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        // inject derived values
        formData.set('semester', sem)
        formData.set('subject', subject)
        formData.set('group', group)
        if (folderId) formData.set('folder_id', folderId)

        startTransition(async () => {
            const res = await fetch('/api/notes/upload', { method: 'POST', body: formData })
            const json = await res.json()
            if (json.error) {
                router.push(`/notes/upload?error=${encodeURIComponent(json.error)}`)
            } else {
                router.push(json.redirect ?? '/notes')
            }
        })
    }

    return (
        <div className="min-h-screen pt-48 p-8 text-[#ededed]">
            <div className="max-w-2xl mx-auto">
                <header className="flex justify-between items-center mb-16">
                    <div className="flex items-center gap-8">
                        <Link href="/notes" className="text-gray-500 hover:text-white transition-all text-sm font-bold uppercase tracking-widest">
                            ← Back to Library
                        </Link>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">Contribution</p>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">Upload Notes</h1>
                        </div>
                    </div>
                    <form action={logout}>
                        <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-2.5 rounded-full text-xs font-black tracking-widest uppercase transition-all border border-red-500/20">
                            Logout
                        </button>
                    </form>
                </header>

                <div className="glass p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <span className="text-8xl">📚</span>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 text-xs font-bold text-red-400 glass border-red-500/20 rounded-2xl text-center bg-red-500/5">
                            {error}
                        </div>
                    )}

                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">

                            {/* Title */}
                            <div className="space-y-2">
                                <label className={labelBase}>Item Title</label>
                                <input
                                    name="title"
                                    type="text"
                                    placeholder="e.g., Data Structures — Unit 2 Notes"
                                    required
                                    className={inputBase}
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className={labelBase}>Description</label>
                                <textarea
                                    name="description"
                                    placeholder="Brief summary of what these notes cover..."
                                    rows={3}
                                    className={`${inputBase} resize-none`}
                                />
                            </div>

                            {/* Row 1: Year + Semester */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className={labelBase}>Year</label>
                                    <select
                                        name="year"
                                        required
                                        value={year}
                                        onChange={e => { setYear(e.target.value); setSem(''); setDept(''); setGroup(''); setSubject('') }}
                                        className={inputBase}
                                    >
                                        <option value="" disabled className="text-gray-900 bg-[#111]">Select Year</option>
                                        {[1,2,3,4].map(y => <option key={y} value={y} className="bg-[#111] text-white">{y === 1 ? '1st' : y === 2 ? '2nd' : y === 3 ? '3rd' : '4th'} Year</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className={labelBase}>Semester</label>
                                    <select
                                        name="sem_display"
                                        required
                                        value={sem}
                                        disabled={!year}
                                        onChange={e => { setSem(e.target.value); setSubject('') }}
                                        className={`${inputBase} disabled:opacity-40`}
                                    >
                                        <option value="" disabled className="bg-[#111]">{year ? 'Select Semester' : 'Select Year first'}</option>
                                        {semOptions.map(s => <option key={s} value={s} className="bg-[#111] text-white">{s} — Semester {s.replace('S', '')}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Row 2: Group (Y1) or Department (Y2-4) */}
                            {year && (
                                <div className="space-y-2">
                                    {isFirstYear ? (
                                        <>
                                            <label className={labelBase}>Stream Group</label>
                                            <select
                                                name="department"
                                                required
                                                value={group}
                                                onChange={e => { setGroup(e.target.value as GroupKey); setSubject('') }}
                                                className={inputBase}
                                            >
                                                <option value="" disabled className="bg-[#111]">Select Group</option>
                                                {GROUPS.map(g => <option key={g.code} value={g.code} className="bg-[#111] text-white">{g.label}</option>)}
                                            </select>
                                        </>
                                    ) : (
                                        <>
                                            <label className={labelBase}>Department</label>
                                            <select
                                                name="department"
                                                required
                                                value={dept}
                                                onChange={e => { setDept(e.target.value as DeptKey); setSubject('') }}
                                                className={inputBase}
                                            >
                                                <option value="" disabled className="bg-[#111]">Select Department</option>
                                                {DEPTS.map(d => <option key={d.code} value={d.code} className="bg-[#111] text-white">{d.label}</option>)}
                                            </select>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Subject */}
                            {subjectList.length > 0 && (
                                <div className="space-y-2">
                                    <label className={labelBase}>Subject</label>
                                    <select
                                        name="subject_display"
                                        required
                                        value={subject}
                                        onChange={e => {
                                            const newSubject = e.target.value
                                            setSubject(newSubject)
                                            setFolderId('')
                                            loadFolders(newSubject, dept || group, year, sem)
                                        }}
                                        className={inputBase}
                                    >
                                        <option value="" disabled className="bg-[#111]">Select Subject</option>
                                        {subjectList.map((s, i) => <option key={i} value={s} className="bg-[#111] text-white">{s}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Folder (optional) */}
                            {subject && !subject.startsWith('PYQ - ') && !subject.startsWith('Video - ') && (
                                <div className="space-y-2">
                                    <label className={labelBase}>Folder <span className="text-gray-700 normal-case tracking-normal font-medium">(optional)</span></label>
                                    {loadingFolders ? (
                                        <div className={`${inputBase} flex items-center gap-3 opacity-50`}>
                                            <span className="text-xs animate-pulse">Loading folders...</span>
                                        </div>
                                    ) : folders.length === 0 ? (
                                        <div className={`${inputBase} text-gray-600 text-sm`}>
                                            No folders for this subject yet
                                        </div>
                                    ) : (
                                        <select
                                            name="folder_display"
                                            value={folderId}
                                            onChange={e => setFolderId(e.target.value)}
                                            className={inputBase}
                                        >
                                            <option value="" className="bg-[#111]">No folder (subject root)</option>
                                            {folders.map(f => (
                                                <option key={f.id} value={f.id} className="bg-[#111] text-white">📁 {f.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            {/* File */}
                            <div className="space-y-2">
                                <label className={labelBase}>Note File (PDF/Docs)</label>
                                <input
                                    name="file"
                                    type="file"
                                    required
                                    className={`${inputBase} file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-blue-500 file:text-white file:uppercase file:tracking-widest`}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isPending || !subject}
                            className="w-full mt-4 bg-white text-black hover:bg-gray-200 disabled:opacity-40 font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all text-lg uppercase tracking-widest"
                        >
                            {isPending ? 'Uploading...' : 'Publish Notes'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
