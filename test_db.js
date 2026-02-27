import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ysllolnoyezfdllqocgv.supabase.co'
const supabaseKey = 'sb_publishable_FwJxMntZ8Hiqze7RUK0gcQ_L_0DGAbs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    console.log("Fetching RLS policies for 'notes' table...");

    // We cannot query pg_policies directly through the anon key usually, 
    // but we can try fetching the notes again and checking the exact error, 
    // or trying a raw SQL RPC if one exists.
    // Since we can't query pg_policies via anon key, I'll provide a drop-and-recreate SQL script directly to the user.
}
test()
