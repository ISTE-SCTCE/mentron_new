import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import { createProject, updateApplicationStatus } from './actions'

export default async function AdminProjectsPage() {
    const supabase = await createClient()

    // 1. Fetch all projects with their applications
    const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
      *,
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
        <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] p-8 pt-24 md:pt-32">
            <div className="max-w-6xl mx-auto">
                {projectsError && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                        <p className="text-red-400 text-sm font-bold">Error fetching data: {projectsError.message}</p>
                    </div>
                )}
                <header className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-6">
                        <Link href="/admin" className="text-gray-400 hover:text-white transition-all">
                            ← Admin
                        </Link>
                        <h1 className="text-4xl font-bold tracking-tight text-white">Project Management</h1>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create Project Section */}
                    <div className="lg:col-span-1">
                        <section className="bg-[#171717] p-6 rounded-2xl border border-white/10 sticky top-8">
                            <h2 className="text-xl font-bold mb-6 text-blue-500">Create New Project</h2>
                            <form action={createProject} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Project Title</label>
                                    <input
                                        name="title"
                                        type="text"
                                        placeholder="e.g. AI Research Intern"
                                        required
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                    <textarea
                                        name="description"
                                        rows={4}
                                        placeholder="Describe the project goals and requirements..."
                                        required
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-3 bg-[#0a0a0a] p-4 rounded-lg border border-white/10">
                                    <input
                                        type="checkbox"
                                        name="cv_required"
                                        id="cv_required_admin"
                                        defaultChecked={true}
                                        value="true"
                                        className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500/50 bg-black/50"
                                    />
                                    <div>
                                        <label htmlFor="cv_required_admin" className="text-sm font-bold text-white cursor-pointer block">Require CV Upload</label>
                                        <p className="text-xs text-gray-400">If checked, applicants must provide a CV.</p>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all"
                                >
                                    Post Project
                                </button>
                            </form>
                        </section>
                    </div>

                    {/* Projects and Applications List */}
                    <div className="lg:col-span-2 space-y-6">
                        {projects && projects.length > 0 ? (
                            projects.map((project: any) => (
                                <div key={project.id} className="bg-[#171717] rounded-2xl border border-white/10 overflow-hidden">
                                    <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                                        <h3 className="text-2xl font-bold mb-1">{project.title}</h3>
                                        <p className="text-xs text-gray-500">Created {new Date(project.created_at).toLocaleDateString()}</p>
                                    </div>

                                    <div className="p-6">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                                            Applications ({project.project_applications?.length || 0})
                                        </h4>

                                        {project.project_applications && project.project_applications.length > 0 ? (
                                            <div className="space-y-4">
                                                {project.project_applications.map((app: any) => (
                                                    <div key={app.id} className="bg-[#0a0a0a] p-4 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div>
                                                            <p className="font-bold text-white">{app.profiles?.full_name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {app.profiles?.roll_number} • {app.profiles?.department}
                                                            </p>
                                                            <a
                                                                href={app.cv_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-500 hover:text-blue-400 text-xs font-bold mt-2 inline-block"
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
                                                                    className={`text-xs font-bold py-1.5 px-3 rounded-lg border-0 bg-white/[0.05] focus:ring-2 focus:ring-blue-500 transition-all ${app.status === 'approved' ? 'text-green-500' :
                                                                            app.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'
                                                                        }`}
                                                                >
                                                                    <option value="pending">Pending</option>
                                                                    <option value="approved">Approve</option>
                                                                    <option value="rejected">Reject</option>
                                                                </select>
                                                                <button type="submit" className="text-[10px] bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all">
                                                                    Save
                                                                </button>
                                                            </form>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-600 italic">No applications yet.</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                <p className="text-gray-500">No projects created yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
