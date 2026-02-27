import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

async function migrateDepartments() {
    console.log('Starting migration...')

    const env = fs.readFileSync('.env.local', 'utf8')
    const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^ \n]+)/)?.[1]
    const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=([^ \n]+)/)?.[1]

    if (!url || !key) {
        console.error('Missing Supabase credentials')
        return
    }

    const supabase = createClient(url, key)

    const updates = [
        { table: 'profiles', column: 'department' },
        { table: 'notes', column: 'department' },
    ]

    for (const { table, column } of updates) {
        console.log(`Migrating ${table}...`)

        // Update MECH AUTO to MEA
        const autoRes = await supabase
            .from(table)
            .update({ [column]: 'MEA' })
            .eq(column, 'MECH AUTO')

        if (autoRes.error) console.error(`Error migrating MECH AUTO in ${table}:`, autoRes.error)
        else console.log(`Migrated MECH AUTO to MEA in ${table}`)

        // Update MECH to ME
        const mechRes = await supabase
            .from(table)
            .update({ [column]: 'ME' })
            .eq(column, 'MECH')

        if (mechRes.error) console.error(`Error migrating MECH in ${table}:`, mechRes.error)
        else console.log(`Migrated MECH to ME in ${table}`)
    }

    console.log('Migration complete.')
}

migrateDepartments()
