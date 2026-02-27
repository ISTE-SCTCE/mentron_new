'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { Search, Rocket, FileText, ChevronRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function GlobalSearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<{ id: string; title: string; type: 'project' | 'note' }[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([])
            setIsOpen(false)
            return
        }

        const fetchResults = async () => {
            setIsLoading(true)
            setIsOpen(true)

            try {
                const [projectsRes, notesRes] = await Promise.all([
                    supabase
                        .from('projects')
                        .select('id, title')
                        .ilike('title', `%${query}%`)
                        .limit(4),
                    supabase
                        .from('notes')
                        .select('id, title')
                        .ilike('title', `%${query}%`)
                        .limit(4)
                ])

                const formattedProjects = (projectsRes.data || []).map(p => ({
                    id: p.id,
                    title: p.title,
                    type: 'project' as const
                }))

                const formattedNotes = (notesRes.data || []).map(n => ({
                    id: n.id,
                    title: n.title,
                    type: 'note' as const
                }))

                setResults([...formattedProjects, ...formattedNotes])
            } catch (error) {
                console.error('Global search error:', error)
            } finally {
                setIsLoading(false)
            }
        }

        const timeoutId = setTimeout(fetchResults, 300)
        return () => clearTimeout(timeoutId)
    }, [query, supabase])

    const handleSelect = (item: { id: string; title: string; type: 'project' | 'note' }) => {
        setIsOpen(false)
        setQuery('')
        if (item.type === 'project') {
            router.push(`/projects/${item.id}`)
        } else {
            router.push(`/notes?q=${encodeURIComponent(item.title)}`)
        }
    }

    return (
        <div className="relative flex-1 md:w-80 group" ref={dropdownRef}>
            <input
                type="text"
                placeholder="Search resources..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && setIsOpen(true)}
                className="w-full glass bg-white/5 border-white/10 rounded-2xl px-12 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder-gray-500"
            />
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <Search className="w-4 h-4" />}
            </span>

            {isOpen && (results.length > 0 || isLoading) && (
                <div className="absolute top-full left-0 right-0 mt-3 glass-card bg-[#0A0A12]/90 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden z-50 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2">
                        {isLoading && results.length === 0 ? (
                            <div className="p-8 text-center text-xs font-black tracking-[0.2em] text-gray-500 uppercase">
                                Scanning mainframe...
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-1">
                                {results.map((item) => (
                                    <button
                                        key={`${item.type}-${item.id}`}
                                        onClick={() => handleSelect(item)}
                                        className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/5 transition-all text-left group/item"
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'project' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                                            }`}>
                                            {item.type === 'project' ? <Rocket size={18} /> : <FileText size={18} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black tracking-widest uppercase opacity-50 mb-0.5">
                                                {item.type === 'project' ? 'Project' : 'Study Note'}
                                            </p>
                                            <p className="text-sm font-bold text-white truncate">{item.title}</p>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-600 group-hover/item:text-white transition-colors" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-xs font-black tracking-[0.2em] text-gray-500 uppercase">
                                No matches found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
