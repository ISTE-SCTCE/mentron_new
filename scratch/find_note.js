const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Manually parse .env.local 
const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
    const parts = line.split('=')
    if (parts.length >= 2) {
        const key = parts[0].trim()
        const value = parts.slice(1).join('=').trim()
        env[key] = value
    }
})

async function findSpecificNote() {
    const supabase = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    console.log('Searching for note: "Digital Design & Computer Architecture RISC-V Edition.pdf"')
    
    const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .ilike('title', '%Digital Design%')
        .order('created_at', { ascending: false })
        .limit(1)

    if (error) {
        console.error('Error:', error)
        return
    }

    if (!notes || notes.length === 0) {
        console.log('No matching note found in DB. (Check RLS or Title)')
        return
    }

    const n = notes[0]
    console.log('--- NOTE METADATA FOUND ---')
    console.log(`ID: ${n.id}`)
    console.log(`Title: "${n.title}"`)
    console.log(`Subject: "${n.subject}"`)
    console.log(`Dept: "${n.department}"`)
    console.log(`Year: ${n.year} (Type: ${typeof n.year})`)
    console.log(`Sem: "${n.semester}"`)
    console.log(`FolderID: ${n.folder_id}`)
    console.log(`Created: ${n.created_at}`)
    console.log('---------------------------')
}

findSpecificNote()
