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
    
    console.log('--- RECENT S4 NOTES DIAGNOSTIC ---')
    const { data: notes, error } = await supabase
        .from('notes')
        .select('id, title, subject, department, semester, year, folder_id, created_at')
        .eq('year', 2)
        .eq('semester', 'S4')
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Query Error:', error)
        return
    }

    if (!notes || notes.length === 0) {
        console.log('NO S4, YEAR 2 NOTES FOUND WITH ANON KEY. (Checking all recently created notes instead...)')
        const { data: allRecent } = await supabase
            .from('notes')
            .select('id, title, subject, department, semester, year, created_at')
            .order('created_at', { ascending: false })
            .limit(10)
        console.log(JSON.stringify(allRecent, null, 2))
        return
    }

    console.log(JSON.stringify(notes, null, 2))
}

diag()
