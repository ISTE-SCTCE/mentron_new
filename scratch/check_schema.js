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
    
    const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Query Error:', error)
        return
    }

    if (notes && notes.length > 0) {
        console.log('Columns in notes table:', Object.keys(notes[0]).join(', '))
    } else {
        console.log('Notes table is empty or inaccessible.')
    }
}

diag()
