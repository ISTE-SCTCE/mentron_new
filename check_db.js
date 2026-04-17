
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDB() {
  const { data: profiles, error: pError } = await supabase.from('profiles').select('role, count(*)').group('role')
  console.log('--- Profile Role Distribution ---')
  console.log(profiles)
  if (pError) console.error(pError)

  const { count: notesCount } = await supabase.from('notes').select('*', { count: 'exact', head: true })
  console.log('\n--- Notes Count ---')
  console.log(notesCount)

  const { data: interactionLogs } = await supabase.from('interaction_logs').select('profiles(role)').limit(100)
  const logsCount = interactionLogs?.filter(l => l.profiles?.role === 'member').length
  console.log('\n--- Interaction Logs (Filtered for member) ---')
  console.log(logsCount)
}

checkDB()
