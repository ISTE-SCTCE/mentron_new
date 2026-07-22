import { createClient } from '@/app/lib/supabase/server'
import { LeaderboardClient } from './LeaderboardClient'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: students } = await supabase
    .from('leaderboard_view')
    .select('full_name, roll_number, department, xp, role')
    .order('xp', { ascending: false })
    .limit(50)

  return <LeaderboardClient students={students || []} />
}
