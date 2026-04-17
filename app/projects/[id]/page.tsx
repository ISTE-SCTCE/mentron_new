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
            <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">Project not found</h1>
                <Link href="/projects" className="text-blue-500 hover:underline">Back to Projects</Link>
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
        <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] p-8">
            <div className="max-w-3xl mx-auto">
                <header className="mb-12">
                    <Link href="/projects" className="text-gray-400 hover:text-white transition-all mb-4 inline-block">
                        ← Back to Projects
                    </Link>
                    <h1 className="text-5xl font-black tracking-tighter mb-4">{project.title}</h1>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <span>Posted by {project.profiles?.full_name}</span>
                        <span>•</span>
                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                </header>

                <section className="bg-[#171717] p-8 rounded-3xl border border-white/10 mb-8">
                    <h2 className="text-xl font-bold mb-4 text-blue-500 uppercase tracking-widest text-xs">Description</h2>
                    <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {project.description}
                    </div>
                </section>

                <section className="bg-[#171717] p-8 rounded-3xl border border-white/10">
                    <h2 className="text-xl font-bold mb-6">Application</h2>

                    {existingApplication ? (
                        <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-2xl flex flex-col items-center text-center">
                            <span className="text-blue-500 text-3xl mb-2">✓</span>
                            <h3 className="text-lg font-semibold mb-1">You have already applied</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                Current Status: <span className="uppercase font-bold text-blue-400">{existingApplication.status}</span>
                            </p>
                            <span className="text-xs text-gray-500 italic">Submitted on {new Date(existingApplication.created_at).toLocaleDateString()}</span>
                        </div>
                    ) : (
                        <form action={applyToProject} className="space-y-6">
                            <input type="hidden" name="project_id" value={id} />
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Upload your CV (PDF preferred)</label>
                                <div className="relative group">
                                    <input
                                        name="cv"
                                        type="file"
                                        required
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-8 text-sm text-gray-400 file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all text-center cursor-pointer"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-2xl transform active:scale-[0.98] transition-all text-lg"
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
