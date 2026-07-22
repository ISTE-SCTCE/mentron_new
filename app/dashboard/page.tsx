import { createClient } from '@/app/lib/supabase/server'
import { getDepartmentFromRollNumber } from '@/app/lib/utils/departmentMapper'
import { isCoreMember } from '@/app/lib/utils/coreAuth'
import { DashboardClient } from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const coreMember = await isCoreMember()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  // Aggregate stats
  const { count: membersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'member')

  const { count: notesCount } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })

  const { count: projectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })

  // Latest 3 events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: false })
    .limit(3)

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Student'
  const displayRole = profile?.role || user?.user_metadata?.role || 'member'
  const displayRoll = profile?.roll_number || user?.user_metadata?.roll_number || 'N/A'
  const identifiedDept = getDepartmentFromRollNumber(displayRoll)
  const displayDept =
    identifiedDept !== 'Other'
      ? identifiedDept
      : profile?.department || user?.user_metadata?.department || 'CSE'
  const userXP = profile?.xp || 0

  return (
    <DashboardClient
      displayName={displayName}
      displayRole={displayRole}
      displayDept={displayDept}
      userXP={userXP}
      totalMembers={membersCount || 0}
      totalNotes={notesCount || 0}
      totalProjects={projectsCount || 0}
      isExec={displayRole === 'exec' || displayRole === 'core' || displayRole === 'admin'}
      coreMember={coreMember}
      events={events || []}
      userEmail={user?.email || null}
    />

  )
}
