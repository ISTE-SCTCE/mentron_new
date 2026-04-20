const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
    const parts = line.split('=')
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim()
})

async function diag() {
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const { data: notes } = await supabase
        .from('notes')
        .select('id, title, subject, department, semester, year, folder_id')
        .order('created_at', { ascending: false })
        .limit(5)

    console.log(JSON.stringify(notes, null, 2))
}

diag()
