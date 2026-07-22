import { createClient } from '@/app/lib/supabase/server'
import { ProjectsClient } from './ProjectsClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const { data: projects } = await supabase
    .from('projects')
    .select('*, profiles(full_name)')
    .or(`is_approved.eq.true,posted_by.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const { data: myApplications } = await supabase
    .from('project_applications')
    .select('project_id')
    .eq('profile_id', user.id)

  const appliedIds = myApplications?.map((a: any) => a.project_id) ?? []

  return (
    <ProjectsClient
      projects={projects ?? []}
      userName={profile?.full_name ?? ''}
      userRole={profile?.role ?? 'member'}
      userId={user.id}
      appliedIds={appliedIds}
    />
  )
}
