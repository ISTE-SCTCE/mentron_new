'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { proposeEventConcept, voteEventConcept, deleteEventConcept } from '@/app/events/actions'
import { ArrowBigUp, ArrowBigDown, MessagesSquare, Clock, User, Trash2 } from 'lucide-react'

interface Vote {
    vote_value: number
    user_id: string
}

interface Concept {
    id: string
    title: string
    description: string
    created_at: string
    profiles?: {
        full_name: string
    }
    event_concept_votes: Vote[]
}

interface Props {
    concepts: Concept[]
    currentUserId?: string
    currentUserRole?: string
}

export function EventConceptsForum({ concepts, currentUserId, currentUserRole }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [error, setError] = useState('')

    const [optimisticConcepts, setOptimisticConcepts] = useState<Concept[]>(concepts)

    // Sync local state when server data updates
    useEffect(() => {
        setOptimisticConcepts(concepts)
    }, [concepts])

    // Aggregate score and format Date manually to keep it functional
    const displayConcepts = optimisticConcepts.map(c => {
        const score = c.event_concept_votes.reduce((acc, v) => acc + v.vote_value, 0)
        let userVote = 0
        if (currentUserId) {
            const v = c.event_concept_votes.find(x => x.user_id === currentUserId)
            if (v) userVote = v.vote_value
        }
        return { ...c, score, userVote }
    }).sort((a, b) => b.score - a.score) // Sort by score descending

    const handlePropose = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        const formData = new FormData(e.currentTarget)
        const res = await proposeEventConcept(formData)

        if (res.error) {
            setError(res.error)
        } else {
            setIsFormOpen(false)
            startTransition(() => {
                router.refresh()
            })
        }
    }

    const handleVote = async (conceptId: string, value: number) => {
        if (!currentUserId) {
            alert('Please login to vote!')
            return
        }

        // Optimistic UI Update locally to remove lag
        setOptimisticConcepts(prev => prev.map(concept => {
            if (concept.id !== conceptId) return concept
            
            const existingVotes = [...concept.event_concept_votes]
            const userVoteIndex = existingVotes.findIndex(v => v.user_id === currentUserId)
            
            if (userVoteIndex >= 0) {
                if (existingVotes[userVoteIndex].vote_value === value) {
                    existingVotes.splice(userVoteIndex, 1) // toggle off
                } else {
                    existingVotes[userVoteIndex].vote_value = value // change vote
                }
            } else {
                existingVotes.push({ user_id: currentUserId, vote_value: value }) // new vote
            }
            return { ...concept, event_concept_votes: existingVotes }
        }))

        // Fire server request
        const res = await voteEventConcept(conceptId, value)
        if (res.error) {
            alert(res.error)
            setOptimisticConcepts(concepts) // Quick revert
        } else {
            startTransition(() => {
                router.refresh()
            })
        }
    }

    const handleDelete = async (conceptId: string) => {
        if (!confirm('Are you sure you want to delete this concept?')) return

        // Optimistic update
        setOptimisticConcepts(prev => prev.filter(c => c.id !== conceptId))

        const res = await deleteEventConcept(conceptId)
        if (res.error) {
            alert(res.error)
            setOptimisticConcepts(concepts) // Quick revert
        } else {
            startTransition(() => {
                router.refresh()
            })
        }
    }

    return (
        <section className="w-full max-w-5xl mx-auto py-16 px-4 md:px-8 relative z-20">
            <div className="flex flex-col items-center mb-12">
                <p className="text-[10px] font-black tracking-[0.4em] text-blue-500 uppercase mb-4">Community Forum</p>
                <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-8">Event Concepts</h2>

                {!isFormOpen ? (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="glass glass-hover px-8 py-4 rounded-full text-sm font-black uppercase tracking-widest text-white border border-blue-500/30 flex items-center gap-3 group transition-all"
                    >
                        Propose an Event Concept
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                ) : (
                    <form onSubmit={handlePropose} className="glass p-8 rounded-3xl w-full max-w-2xl border border-blue-500/20 animate-in fade-in slide-in-from-top-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-white">New Proposal</h3>
                            <button type="button" onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-white">✕</button>
                        </div>
                        {error && <p className="text-red-400 text-xs mb-4 p-3 bg-red-500/10 rounded-lg">{error}</p>}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Concept Title</label>
                                <input
                                    name="title"
                                    type="text"
                                    required
                                    className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                    placeholder="e.g. 24hr AI Hackathon, Web3 Workshop..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</label>
                                <textarea
                                    name="description"
                                    required
                                    rows={4}
                                    className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                                    placeholder="Explain your idea, why it would be cool, and what students would learn..."
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                {isPending ? 'Submitting...' : 'Submit Proposal'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Submissions List - Reddit Style */}
            <div className="space-y-4">
                {displayConcepts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 font-medium">
                        No concepts proposed yet. Be the first!
                    </div>
                ) : (
                    displayConcepts.map(concept => (
                        <div key={concept.id} className="glass rounded-2xl flex border border-white/5 overflow-hidden group hover:border-white/10 transition-colors">
                            {/* Vote Column */}
                            <div className="w-16 bg-white/5 flex flex-col items-center py-4 gap-1 shrink-0">
                                <button
                                    onClick={() => handleVote(concept.id, 1)}
                                    className={`p-1 rounded-md transition-colors ${concept.userVote === 1 ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500 hover:bg-white/10 hover:text-orange-400'}`}
                                >
                                    <ArrowBigUp className={concept.userVote === 1 ? 'fill-current' : ''} />
                                </button>
                                <span className={`text-sm font-black ${
                                    concept.score > 0 ? 'text-orange-500' : concept.score < 0 ? 'text-blue-500' : 'text-white'
                                }`}>
                                    {concept.score}
                                </span>
                                <button
                                    onClick={() => handleVote(concept.id, -1)}
                                    className={`p-1 rounded-md transition-colors ${concept.userVote === -1 ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500 hover:bg-white/10 hover:text-blue-400'}`}
                                >
                                    <ArrowBigDown className={concept.userVote === -1 ? 'fill-current' : ''} />
                                </button>
                            </div>

                            {/* Content Column */}
                            <div className="p-4 md:p-6 flex-1 bg-black/20 flex flex-col">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span className="flex items-center gap-1 font-medium bg-white/5 px-2 py-1 rounded-full text-gray-300">
                                            <User size={10} /> u/{concept.profiles?.full_name?.replace(/\s+/g, '') || 'deleted'}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(concept.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {/* Delete Button */}
                                    {(currentUserId === concept.user_id || currentUserRole === 'exec' || currentUserRole === 'core') && (
                                        <button 
                                            onClick={() => handleDelete(concept.id)}
                                            className="text-gray-600 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-full transition-colors"
                                            title="Delete Concept"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 leading-tight">{concept.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed mb-4">{concept.description}</p>
                                
                                <div className="mt-auto flex items-center gap-4 text-xs font-bold text-gray-500">
                                    <button className="flex items-center gap-1.5 hover:bg-white/5 py-1.5 px-3 rounded-lg transition-colors">
                                        <MessagesSquare size={14} /> Discuss Event
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    )
}
