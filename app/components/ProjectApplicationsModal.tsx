'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/app/lib/supabase/client'

interface Application {
    id: string
    created_at: string
    message: string
    cv_url: string
    status: string
    applicant_id: string
    profiles: {
        full_name: string | null
        department: string | null
        roll_number: string | null
        year: number | null
    }
}

interface Props {
    projectId: string
    projectTitle: string
    onClose: () => void
}

export function ProjectApplicationsModal({ projectId, projectTitle, onClose }: Props) {
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [error, setError] = useState('')

    const supabase = createClient()

    const fetchApplications = useCallback(async () => {
        setLoading(true)
        setError('')

        // Join project_applications with profiles table to get applicant info
        const { data, error: fetchErr } = await supabase
            .from('project_applications')
            .select(`
                id,
                created_at,
                message,
                cv_url,
                status,
                applicant_id,
                profiles (
                    full_name,
                    department,
                    roll_number,
                    year
                )
            `)
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })

        if (fetchErr) {
            console.error('Fetch error:', fetchErr)
            setError('Failed to load applications. Please try again.')
        } else if (data) {
            setApplications(data as unknown as Application[])
        }
        setLoading(false)
    }, [projectId, supabase])

    const handleUpdateStatus = async (appId: string, applicantId: string, newStatus: string) => {
        setUpdatingId(appId)
        
        // Update the application status
        const { error: updateErr } = await supabase
            .from('project_applications')
            .update({ status: newStatus })
            .eq('id', appId)

        if (updateErr) {
            alert('Failed to update status: ' + updateErr.message)
            setUpdatingId(null)
            return
        }

        // Insert notification
        const title = newStatus === 'approved' ? 'Application Accepted 🎉' : 'Application Update'
        const message = newStatus === 'approved' 
            ? `Your application for "${projectTitle}" has been accepted.`
            : `Your application for "${projectTitle}" has been rejected. Thank you for your interest.`
            
        await supabase.from('notifications').insert({
            user_id: applicantId,
            title,
            message
        })

        // Update local state
        setApplications(apps => apps.map(app => app.id === appId ? { ...app, status: newStatus } : app))
        setUpdatingId(null)
    }

    useEffect(() => {
        fetchApplications()
    }, [fetchApplications])

    return (
        <div className="fixed inset-0 z-[9998] flex items-start justify-center p-4 pt-20 md:pt-32 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-3xl max-h-[85vh] flex flex-col glass rounded-[2.5rem] p-8 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex justify-between items-start mb-8 shrink-0">
                    <div>
                        <p className="text-[10px] font-black tracking-[0.3em] text-cyan-500 uppercase mb-1">Recruitment</p>
                        <h2 className="text-2xl font-black text-white leading-tight">Applicants for</h2>
                        <h3 className="text-lg font-black text-blue-400 leading-tight">{projectTitle}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl glass bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10 shrink-0"
                    >
                        ✕
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 space-y-4">
                            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Loading candidates...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                            <span className="text-2xl mb-2 block">⚠️</span>
                            <p className="text-red-400 text-sm font-bold">{error}</p>
                            <button
                                onClick={fetchApplications}
                                className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-3xl glass text-center px-4">
                            <p className="text-4xl mb-3 grayscale opacity-50">📬</p>
                            <p className="text-gray-400 font-bold text-lg">No applications yet</p>
                            <p className="text-gray-600 text-xs font-medium mt-1">When students apply, they will appear here.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {applications.map((app) => (
                                <div key={app.id} className="glass bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all group">
                                    <div className="flex flex-col md:flex-row gap-6 md:items-start">

                                        {/* Avatar & Core Info */}
                                        <div className="flex gap-4 min-w-[200px] shrink-0">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-xl font-black text-white shrink-0">
                                                {(app.profiles?.full_name ?? 'A')[0]}
                                            </div>
                                            <div>
                                                <h4 className="text-base font-black text-white mb-0.5">{app.profiles?.full_name || 'Anonymous Applicant'}</h4>
                                                <div className="flex flex-col text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                    <span>{app.profiles?.department || 'Unknown Dept'} · Year {app.profiles?.year || '?'}</span>
                                                    <span className="text-blue-400 mt-0.5">{app.profiles?.roll_number || 'No Roll Number'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pitch Message */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Cover Note</p>
                                            <div className="bg-black/30 rounded-xl p-4 border border-white/5 relative">
                                                <span className="absolute -top-2 -left-2 text-2xl opacity-20 text-white">❝</span>
                                                <p className="text-sm font-medium text-gray-300 italic leading-relaxed relative z-10">
                                                    {app.message || "No cover message provided."}
                                                </p>
                                            </div>
                                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-3 text-right">
                                                Applied on {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>

                                        {/* Actions: CV & Status */}
                                        <div className="shrink-0 flex flex-col md:items-end gap-3 w-full md:w-auto">
                                            {app.cv_url && (
                                                <a
                                                    href={app.cv_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-6 py-2.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-600/30 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all group-hover:scale-[1.02] active:scale-95 w-full md:w-auto justify-center"
                                                >
                                                    <span>📄</span> View CV
                                                </a>
                                            )}

                                            <div className="flex items-center gap-2 w-full md:w-auto">
                                                {app.status === 'pending' || !app.status ? (
                                                    <>
                                                        <button 
                                                            disabled={updatingId === app.id}
                                                            onClick={() => handleUpdateStatus(app.id, app.applicant_id, 'approved')}
                                                            className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                                        >
                                                            {updatingId === app.id ? '...' : '✓ Accept'}
                                                        </button>
                                                        <button 
                                                            disabled={updatingId === app.id}
                                                            onClick={() => handleUpdateStatus(app.id, app.applicant_id, 'rejected')}
                                                            className="flex-1 md:flex-none px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                                        >
                                                            {updatingId === app.id ? '...' : '✕ Reject'}
                                                        </button>
                                                    </>
                                                ) : app.status === 'approved' ? (
                                                    <span className="w-full md:w-auto text-center px-4 py-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                        ✓ Accepted
                                                    </span>
                                                ) : (
                                                    <span className="w-full md:w-auto text-center px-4 py-2.5 bg-red-500/20 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                                                        ✕ Rejected
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
