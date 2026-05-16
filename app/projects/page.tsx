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
        <div className="min-h-screen p-4 md:p-8 pt-24 md:pt-32 pb-28 text-[#241653]">
            <div className="max-w-[1800px] mx-auto">
                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <p className="text-[10px] font-black tracking-[0.3em] text-[#ff8a24] uppercase mb-3">Practice Lab</p>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-[#241653]">Active Projects</h1>
                        <p className="text-[#7b739b] text-sm font-medium mt-2">
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
