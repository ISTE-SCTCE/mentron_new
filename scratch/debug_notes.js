const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function checkRecentNotes() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Error fetching notes:', error)
        return
    }

    console.log('--- RECENT NOTES ---')
    notes.forEach(n => {
        console.log(`ID: ${n.id}`)
        console.log(`Title: ${n.title}`)
        console.log(`Subject: "${n.subject}"`)
        console.log(`Dept: "${n.department}"`)
        console.log(`Sem: "${n.semester}"`)
        console.log(`Year: ${n.year}`)
        console.log(`Folder: ${n.folder_id}`)
        console.log(`Created: ${n.created_at}`)
        console.log('---')
    })
}

checkRecentNotes()
