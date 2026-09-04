import { createClient } from '@/app/lib/supabase/server'
import { ProjectsList } from './ProjectsList'
import { redirect } from 'next/navigation'
import { NotificationBell } from '@/app/components/NotificationBell'
import { ThemeSwitcher } from '@/app/components/ThemeSwitcher'

export default async function ProjectsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

    const { data: projects, error } = await supabase
        .from('projects')
        .select('*, profiles(full_name)')
        .or(`is_approved.eq.true,posted_by.eq.${user.id}`) // Show approved OR own projects
        .order('created_at', { ascending: false })

    if (error) console.error('Fetch projects error:', error)

    const { data: myApplications } = await supabase
        .from('project_applications')
        .select('project_id')
        .eq('profile_id', user.id)

    const appliedIds = myApplications?.map(a => a.project_id) ?? []

    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8 pt-20 sm:pt-28 md:pt-32 text-[#ededed]">
            <div className="max-w-[1800px] mx-auto">
                <header className="mb-8 sm:mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <p className="text-[10px] font-black tracking-[0.3em] text-cyan-400 uppercase mb-2 flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-gradient-to-r from-purple-500 to-cyan-400 inline-block" />
                            Innovations
                        </p>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white">Active Projects</h1>
                        <p className="text-gray-400 text-xs sm:text-sm font-medium mt-1">
                            Browse open internship positions and submit your application.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeSwitcher />
                        <NotificationBell userId={user.id} />
                    </div>
                </header>

                <ProjectsList
                    projects={projects ?? []}
                    userName={profile?.full_name ?? ''}
                    userEmail={user.email ?? ''}
                    userRole={profile?.role ?? 'student'}
                    userId={user.id}
                    existingApplicationProjectIds={appliedIds}
                />
            </div>
        </div>
    )
}
