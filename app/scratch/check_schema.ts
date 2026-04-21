import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testUpdate() {
  // Try to update a profile (using the service role or just testing schema)
  const { data, error } = await supabase
    .from('profiles')
    .select('current_session_id')
    .limit(1)
  
  console.log('Schema Check:', { data, error })
  
  if (error) {
    console.error('Error fetching profiles:', error)
  } else {
    console.log('Successfully fetched profile. current_session_id exists in schema.')
  }
}

testUpdate()
