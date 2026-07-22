import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsPageClient } from './SettingsPageClient'
import { getDepartmentFromRollNumber } from '@/app/lib/utils/departmentMapper'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Member'
  const displayRole = profile?.role || user?.user_metadata?.role || 'member'
  const displayRoll = profile?.roll_number || user?.user_metadata?.roll_number || 'N/A'
  const displayYear = profile?.year || user?.user_metadata?.year || 'N/A'
  const identifiedDept = getDepartmentFromRollNumber(displayRoll)
  const displayDept =
    identifiedDept !== 'Other'
      ? identifiedDept
      : profile?.department || user?.user_metadata?.department || 'Not Assigned'
  const userXP = profile?.xp || 0
  const isteId = profile?.iste_id || null

  return (
    <SettingsPageClient
      displayName={displayName}
      displayRole={displayRole}
      displayDept={displayDept}
      displayRoll={displayRoll}
      displayYear={displayYear}
      userXP={userXP}
      isteId={isteId}
      userEmail={user.email || ''}
      profile={profile}
    />
  )
}
