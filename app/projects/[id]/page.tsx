import { createClient } from '@/app/lib/supabase/server'
import Link from 'next/link'
import { applyToProject } from '../actions'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Fetch project details
    const { data: project, error } = await supabase
        .from('projects')
        .select('*, profiles(full_name)')
        .eq('id', id)
        .single()

    if (error || !project) {
        return (
            <div className="min-h-screen text-white flex flex-col items-center justify-center p-4">
                <div className="glass-card p-8 sm:p-12 rounded-3xl text-center max-w-md w-full border-white/10">
                    <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
                    <p className="text-gray-400 text-sm mb-6">The requested project could not be found or has been removed.</p>
                    <Link href="/projects" className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition-all">
                        ← Back to Projects
                    </Link>
                </div>
            </div>
        )
    }

    // 2. Check if current user has already applied
    const { data: { user } } = await supabase.auth.getUser()
    const { data: existingApplication } = await supabase
        .from('project_applications')
        .select('*')
        .eq('project_id', id)
        .eq('profile_id', user?.id)
        .single()

    return (
        <div className="min-h-screen text-[#ededed] p-4 sm:p-6 md:p-8 pt-20 sm:pt-28 md:pt-32">
            <div className="max-w-3xl mx-auto">
                <header className="mb-8 sm:mb-12">
                    <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors mb-4 group">
                        <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Back to Projects
                    </Link>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter mb-4 text-white break-words">{project.title}</h1>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-gray-400 text-xs sm:text-sm">
                        <span>Posted by <strong className="text-white">{project.profiles?.full_name || 'Anonymous'}</strong></span>
                        <span>•</span>
                        <span>{new Date(project.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    </div>
                </header>

                <section className="glass-card p-6 sm:p-8 rounded-3xl border-white/10 mb-6 sm:mb-8">
                    <h2 className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-4">Description</h2>
                    <div className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                        {project.description}
                    </div>
                </section>

                <section className="glass-card p-6 sm:p-8 rounded-3xl border-white/10">
                    <h2 className="text-xs font-black uppercase tracking-widest text-purple-400 mb-6">Application</h2>

                    {existingApplication ? (
                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-2xl flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-xl mb-3">
                                ✓
                            </div>
                            <h3 className="text-base font-bold text-white mb-1">Application Submitted</h3>
                            <p className="text-gray-400 text-xs sm:text-sm mb-4">
                                Current Status: <span className="uppercase font-bold text-emerald-400">{existingApplication.status}</span>
                            </p>
                            <span className="text-xs text-gray-500 italic">Submitted on {new Date(existingApplication.created_at).toLocaleDateString()}</span>
                        </div>
                    ) : (
                        <form action={applyToProject} className="space-y-6">
                            <input type="hidden" name="project_id" value={id} />
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Upload your CV (PDF preferred)</label>
                                <div className="relative group">
                                    <input
                                        name="cv"
                                        type="file"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-6 text-sm text-gray-400 file:mr-4 file:py-2 file:px-5 file:rounded-full file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-gradient-to-r file:from-purple-600 file:to-indigo-600 file:text-white hover:file:from-purple-500 hover:file:to-indigo-500 transition-all cursor-pointer"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl shadow-[0_0_25px_rgba(112,0,223,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all text-xs sm:text-sm uppercase tracking-widest"
                            >
                                Submit Application
                            </button>
                        </form>
                    )}
                </section>
            </div>
        </div>
    )
}
