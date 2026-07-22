import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ysllolnoyezfdllqocgv.supabase.co'
const supabaseKey = 'sb_publishable_FwJxMntZ8Hiqze7RUK0gcQ_L_0DGAbs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    console.log("Fetching project application joined with projects and profiles...");
    const { data, error } = await supabase
        .from('project_applications')
        .select('*, projects(*, profiles(full_name))')
        .limit(1)

    if (error) {
        console.error("Error:", error)
    } else {
        console.log("Data:", JSON.stringify(data, null, 2))
    }
}
test()
