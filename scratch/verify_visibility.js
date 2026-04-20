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
    
    console.log('--- TESTING VISIBILITY FIX (WITHOUT folder_id) ---')
    const { data: notes, error } = await supabase
        .from('notes')
        .select('id, title, subject, department, semester, year, created_at')
        .eq('year', 2)
        .eq('semester', 'S4')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Final Query Error:', error)
        return
    }

    console.log(`Success! Found ${notes?.length || 0} notes for S4, Year 2.`)
    if (notes && notes.length > 0) {
        console.log('Sample Note:', notes[0].title)
    }
}

diag()
