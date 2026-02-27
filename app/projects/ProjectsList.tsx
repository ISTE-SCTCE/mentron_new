'use client'

import { useState } from 'react'
import { ApplyModal } from '@/app/components/ApplyModal'
import { CreateProjectModal } from '@/app/components/CreateProjectModal'
import { ProjectApplicationsModal } from '@/app/components/ProjectApplicationsModal'
import { InteractionTracker } from '@/app/components/InteractionTracker'
import { DeleteButton } from '@/app/components/DeleteButton'
import { deleteProject } from '@/app/lib/actions/deleteActions'

interface Project {
    id: string
    title: string
    description: string
    created_at: string
    posted_by: string
    profiles?: { full_name: string | null }
}

interface Props {
    projects: Project[]
    userName: string
    userEmail: string
    userRole: string
    userId: string
    existingApplicationProjectIds: string[]
}

function ProjectCard({
    project,
    isOwn,
    isExec,
    hasApplied,
    onApply,
    onViewApps,
}: {
    project: Project
    isOwn: boolean
    isExec: boolean
    hasApplied: boolean
    onApply: () => void
    onViewApps?: () => void
}) {
    return (
        <InteractionTracker itemType="project" itemId={project.id} interactionType="view" trigger="mount">
            <div className="glass-card flex flex-col group relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <span className="text-8xl font-black">🚀</span>
                </div>

                <div className="flex justify-between items-start mb-5">
                    <span className="text-[10px] font-black tracking-widest text-gray-600 uppercase">
                        {new Date(project.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {hasApplied && (
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">
                            ✓ Applied
                        </span>
                    )}
                </div>

                <h2 className="text-xl font-black leading-tight text-white group-hover:text-glow transition-all mb-2">
                    {project.title}
                </h2>
                <p className="text-gray-400 font-medium leading-relaxed line-clamp-3 text-sm flex-1 mb-6">
                    {project.description}
                </p>

                <div className="flex items-center justify-between border-t border-white/5 pt-5 gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] text-blue-400 font-black shrink-0">
                            {(project.profiles?.full_name ?? 'E')[0]}
                        </div>
                        <span className="text-[10px] font-black tracking-widest text-gray-600 uppercase">
                            {project.profiles?.full_name || 'Anonymous'}
                        </span>
                    </div>

                    {isOwn || isExec ? (
                        <div className="flex items-center gap-2 shrink-0">
                            {isOwn && (
                                <button
                                    onClick={onViewApps}
                                    className="px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/20 hover:border-transparent transition-all active:scale-95"
                                >
                                    Applications
                                </button>
                            )}
                            <DeleteButton onDelete={() => deleteProject(project.id)} itemName="project" />
                        </div>
                    ) : hasApplied ? (
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 cursor-default">
                            Applied ✓
                        </span>
                    ) : (
                        <button
                            onClick={onApply}
                            className="px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest bg-white text-black hover:bg-blue-500 hover:text-white active:scale-95 shadow-lg transition-all shrink-0"
                        >
                            Apply Now
                        </button>
                    )}
                </div>
            </div>
        </InteractionTracker>
    )
}

export function ProjectsList({ projects, userName, userEmail, userRole, userId, existingApplicationProjectIds }: Props) {
    const [modalProject, setModalProject] = useState<Project | null>(null)
    const [showCreate, setShowCreate] = useState(false)
    const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set(existingApplicationProjectIds))
    const [successId, setSuccessId] = useState<string | null>(null)
    const [viewingAppsFor, setViewingAppsFor] = useState<Project | null>(null)

    const myProjects = projects.filter(p => p.posted_by === userId)
    const otherProjects = projects.filter(p => p.posted_by !== userId)
    const isExec = userRole === 'exec' || userRole === 'admin'

    const handleSuccess = (projectId: string) => {
        setAppliedIds(prev => new Set([...prev, projectId]))
        setSuccessId(projectId)
        setModalProject(null)
        setTimeout(() => setSuccessId(null), 4000)
    }

    return (
        <>
            {/* Success toast */}
            {successId && (
                <div className="fixed bottom-8 right-8 z-[9997] glass bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-lg">
                    <span className="text-emerald-400 text-xl">✓</span>
                    <div>
                        <p className="text-sm font-black text-white">Application submitted!</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">We'll review it soon</p>
                    </div>
                </div>
            )}

            {/* ── My Projects ── */}
            <section className="mb-16">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase mb-1">Your Listings</p>
                        <h2 className="text-2xl font-black text-white">My Projects</h2>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                    >
                        <span>＋</span> Post a Project
                    </button>
                </div>

                {myProjects.length === 0 ? (
                    <div className="glass-card border border-dashed border-white/10 py-16 text-center">
                        <p className="text-3xl mb-3">📋</p>
                        <p className="text-gray-500 font-bold text-sm">You haven't posted any projects yet.</p>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                        >
                            ＋ Post Your First Project
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {myProjects.map(p => (
                            <ProjectCard
                                key={p.id}
                                project={p}
                                isOwn={true}
                                isExec={isExec}
                                hasApplied={false}
                                onApply={() => { }}
                                onViewApps={() => setViewingAppsFor(p)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* ── Explore Projects ── */}
            <section>
                <div className="mb-6">
                    <p className="text-[10px] font-black tracking-[0.3em] text-purple-500 uppercase mb-1">Community</p>
                    <h2 className="text-2xl font-black text-white">Explore Projects</h2>
                    <p className="text-gray-500 text-xs font-medium mt-1">
                        {otherProjects.length} open position{otherProjects.length !== 1 ? 's' : ''} from others
                    </p>
                </div>

                {otherProjects.length === 0 ? (
                    <div className="glass-card border border-dashed border-white/10 py-16 text-center">
                        <p className="text-3xl mb-3">🔭</p>
                        <p className="text-gray-500 font-bold text-sm">No projects from others yet.</p>
                        <p className="text-gray-700 text-xs mt-1">Check back soon for new listings!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {otherProjects.map(p => (
                            <ProjectCard
                                key={p.id}
                                project={p}
                                isOwn={false}
                                isExec={isExec}
                                hasApplied={appliedIds.has(p.id)}
                                onApply={() => setModalProject(p)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Apply Modal */}
            {modalProject && (
                <ApplyModal
                    projectId={modalProject.id}
                    projectTitle={modalProject.title}
                    userName={userName}
                    userEmail={userEmail}
                    onClose={() => setModalProject(null)}
                    onSuccess={() => handleSuccess(modalProject.id)}
                />
            )}

            {/* Create Project Modal */}
            {showCreate && (
                <CreateProjectModal onClose={() => setShowCreate(false)} />
            )}

            {/* View Applications Modal */}
            {viewingAppsFor && (
                <ProjectApplicationsModal
                    projectId={viewingAppsFor.id}
                    projectTitle={viewingAppsFor.title}
                    onClose={() => setViewingAppsFor(null)}
                />
            )}
        </>
    )
}
