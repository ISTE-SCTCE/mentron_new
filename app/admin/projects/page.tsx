import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import { createProject, updateApplicationStatus, approveProject } from './actions'
import { deleteProject } from '@/app/lib/actions/deleteActions'
import { Check, Trash2, ShieldCheck, Clock } from 'lucide-react'

export default async function AdminProjectsPage() {
    const supabase = await createClient()

    // Get user role for conditional layout
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id ?? '').single()
    const isFullAdmin = profile?.role === 'admin'
    const isLeadership = profile?.role === 'exec' || profile?.role === 'core' || profile?.role === 'admin'

    // 1. Fetch all projects with their applications
    const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
      *,
      profiles(full_name),
      project_applications (
        *,
        profiles (
          full_name,
          roll_number,
          department
        )
      )
    `)
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen pt-20 sm:pt-28 md:pt-32 pb-20 px-4 sm:px-6 md:px-8 text-[#ededed]">
            <div className="max-w-6xl mx-auto">
                {projectsError && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                        <p className="text-red-400 text-sm font-bold">Error fetching data: {projectsError.message}</p>
                    </div>
                )}
                <header className="mb-8 sm:mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <Link href="/admin" className="text-[#8b9bb4] hover:text-white transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                            ← Admin Console
                        </Link>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="px-3 py-1 glass rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                            Recruitment & Open Positions
                        </span>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-space-grotesk">
                            Project Management
                        </h1>
                        <p className="text-sm sm:text-base text-[#8b9bb4] max-w-2xl font-medium">
                            Post community initiatives, inspect student CV submissions, and approve project proposals.
                        </p>
                    </div>
                </header>

                <div className={`grid grid-cols-1 ${isFullAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
                    {/* Create Project Section - Only for Full Admins */}
                    {isFullAdmin && (
                        <div className="lg:col-span-1">
                            <section className="glass-card p-6 sm:p-8 rounded-3xl border-purple-500/20 shadow-2xl sticky top-28 sm:top-32 animate-in slide-in-from-left duration-500">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-white/10 flex items-center justify-center text-purple-300">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <h2 className="text-lg font-bold text-white tracking-tight">Post New Project</h2>
                                </div>
                                <form action={createProject} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#8b9bb4] uppercase tracking-wider mb-1.5">Project Title</label>
                                        <input
                                            name="title"
                                            type="text"
                                            placeholder="e.g. AI Research Intern"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#8b9bb4] uppercase tracking-wider mb-1.5">Description</label>
                                        <textarea
                                            name="description"
                                            rows={4}
                                            placeholder="Describe the project goals and requirements..."
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <input
                                            type="checkbox"
                                            name="cv_required"
                                            id="cv_required_admin"
                                            defaultChecked={true}
                                            value="true"
                                            className="w-4 h-4 rounded border-white/20 text-purple-600 focus:ring-purple-500/50 bg-black/50 accent-purple-600"
                                        />
                                        <div>
                                            <label htmlFor="cv_required_admin" className="text-xs font-bold text-white cursor-pointer block">Require CV Upload</label>
                                            <p className="text-[11px] text-[#8b9bb4]">If checked, applicants must submit a CV link.</p>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-purple-500/20 text-sm"
                                    >
                                        Post Project
                                    </button>
                                </form>
                            </section>
                        </div>
                    )}

                    {/* Projects and Applications List */}
                    <div className="lg:col-span-2 space-y-6">
                        {projects && projects.length > 0 ? (
                            projects.map((project: any) => (
                                <div key={project.id} className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-xl">
                                    <div className="p-6 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{project.title}</h3>
                                                {project.is_approved ? (
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                        <Check size={10} /> Live
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-black uppercase tracking-widest border border-yellow-500/20">
                                                        <Clock size={10} /> Pending Approval
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-[#8b9bb4] font-medium">
                                                Posted by {project.profiles?.full_name || 'Admin'} • {new Date(project.created_at).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 self-end sm:self-auto">
                                            {!project.is_approved && isLeadership && (
                                                <form action={approveProject}>
                                                    <input type="hidden" name="project_id" value={project.id} />
                                                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20">
                                                        <Check size={14} /> Approve
                                                    </button>
                                                </form>
                                            )}
                                            <form action={async () => {
                                                'use server'
                                                const res = await deleteProject(project.id)
                                                if (!res.success) throw new Error(res.error)
                                            }}>
                                                <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-transparent hover:border-red-500/20" title="Delete project">
                                                    <Trash2 size={16} />
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <h4 className="text-xs font-bold text-[#8b9bb4] uppercase tracking-widest mb-4">
                                            Applications ({project.project_applications?.length || 0})
                                        </h4>

                                        {project.project_applications && project.project_applications.length > 0 ? (
                                            <div className="space-y-3">
                                                {project.project_applications.map((app: any) => (
                                                    <div key={app.id} className="p-4 sm:p-5 bg-white/[0.03] rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div>
                                                            <p className="font-bold text-white text-sm">{app.profiles?.full_name}</p>
                                                            <p className="text-xs text-[#8b9bb4] mt-0.5">
                                                                {app.profiles?.roll_number} • {app.profiles?.department}
                                                            </p>
                                                            <a
                                                                href={app.cv_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-cyan-400 hover:text-cyan-300 text-xs font-bold mt-2 inline-flex items-center gap-1"
                                                            >
                                                                View CV ↗
                                                            </a>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <form action={updateApplicationStatus} className="flex items-center gap-2">
                                                                <input type="hidden" name="application_id" value={app.id} />
                                                                <select
                                                                    name="status"
                                                                    defaultValue={app.status}
                                                                    className={`text-xs font-bold py-2 px-3 rounded-xl border-0 bg-white/10 focus:ring-2 focus:ring-purple-500 transition-all ${app.status === 'approved' ? 'text-emerald-400' :
                                                                            app.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                                                                        }`}
                                                                >
                                                                    <option value="pending" className="bg-[#0a0a0f] text-yellow-400">Pending</option>
                                                                    <option value="approved" className="bg-[#0a0a0f] text-emerald-400">Approve</option>
                                                                    <option value="rejected" className="bg-[#0a0a0f] text-red-400">Reject</option>
                                                                </select>
                                                                <button type="submit" className="text-xs font-bold bg-white/10 hover:bg-purple-600/30 hover:text-purple-300 px-3 py-2 rounded-xl transition-all">
                                                                    Save
                                                                </button>
                                                            </form>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-[#8b9bb4] italic py-2">No applications submitted yet.</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-16 text-center glass-card rounded-3xl border-dashed border-white/10">
                                <p className="text-sm font-bold text-white mb-1">No projects created yet</p>
                                <p className="text-xs text-[#8b9bb4]">New project initiatives will display here once published.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
