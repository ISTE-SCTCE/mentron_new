'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useCallback, useTransition } from 'react'

export function NotesSearch({ initialQuery, initialFilter }: { initialQuery: string; initialFilter: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [query, setQuery] = useState(initialQuery)
    const [isPending, startTransition] = useTransition()

    const createQueryString = useCallback(
        (params: Record<string, string | null>) => {
            const newSearchParams = new URLSearchParams(searchParams?.toString())

            Object.entries(params).forEach(([key, value]) => {
                if (value === null) {
                    newSearchParams.delete(key)
                } else {
                    newSearchParams.set(key, value)
                }
            })

            return newSearchParams.toString()
        },
        [searchParams]
    )

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(() => {
            router.push(`${pathname}?${createQueryString({ q: query || null })}`)
        })
    }

    const setFilter = (filter: string) => {
        startTransition(() => {
            if (filter === 'contributions') {
                // Clear dept and year so it searches globally across all user contributions
                router.push(`${pathname}?${createQueryString({ filter: 'contributions', dept: null, year: null })}`)
            } else {
                router.push(`${pathname}?${createQueryString({ filter: null })}`)
            }
        })
    }

    return (
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-12">
            <div className="glass rounded-full p-1 flex overflow-x-auto w-full md:w-auto scrollbar-hide">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase transition-all ${initialFilter === 'all' || !initialFilter
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-gray-500 hover:text-gray-300'
                        }`}
                >
                    All Notes
                </button>
                <button
                    onClick={() => setFilter('contributions')}
                    className={`px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap ${initialFilter === 'contributions'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'text-gray-500 hover:text-gray-300'
                        }`}
                >
                    Your Contributions
                </button>
            </div>

            <form onSubmit={handleSearch} className="relative w-full md:w-auto">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search notes..."
                    className="w-full md:w-80 bg-white/5 border border-white/10 rounded-full py-3 px-6 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder-gray-600"
                />
                <button
                    type="submit"
                    disabled={isPending}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-black tracking-widest uppercase hover:bg-blue-500/30 transition-all disabled:opacity-50"
                >
                    {isPending ? '...' : 'Search'}
                </button>
            </form>
        </div>
    )
}
