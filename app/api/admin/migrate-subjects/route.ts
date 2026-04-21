import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { isCoreMember } from '@/app/lib/utils/coreAuth'
import {
    FIRST_YEAR_SUBJECTS,
    CSE_SUBJECTS,
    ECE_SUBJECTS,
    ME_SUBJECTS,
    MEA_SUBJECTS,
    BT_SUBJECTS,
    GroupKey,
    DeptKey,
    SemKey
} from '@/app/lib/data/subjects'

export async function GET() {
    const isAuthorized = await isCoreMember()
    if (!isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

    const inserts: any[] = []

    // Helper to add inserts
    const addInserts = (dept: string, year: number, sem: string, subjects: string[]) => {
        for (const sub of subjects) {
            inserts.push({
                name: sub,
                department: dept,
                year,
                semester: sem,
                subject: 'ROOT',
                created_by: user.id,
                requires_auth: false
            })
        }
    }

    // 1. First Years (Groups A-D, S1-S2, Year = 1)
    for (const [group, sems] of Object.entries(FIRST_YEAR_SUBJECTS)) {
        for (const [sem, subjects] of Object.entries(sems)) {
            addInserts(group, 1, sem, subjects)
        }
    }

    // 2. Y2-Y4 Departments
    const deptMap: Record<string, Record<string, string[]>> = {
        CSE: CSE_SUBJECTS,
        ECE: ECE_SUBJECTS,
        ME: ME_SUBJECTS,
        MEA: MEA_SUBJECTS,
        BT: BT_SUBJECTS
    }

    for (const [dept, sems] of Object.entries(deptMap)) {
        for (const [sem, subjects] of Object.entries(sems)) {
            // Determine year based on sem
            let year = 2
            if (['S5', 'S6'].includes(sem)) year = 3
            if (['S7', 'S8'].includes(sem)) year = 4
            
            addInserts(dept, year, sem, subjects)
        }
    }

    // 3. Batch Process for Speed
    // Fetch all existing ROOT records to prevent duplicates locally
    const { data: existingFolders } = await supabase
        .from('note_folders')
        .select('name, department, year, semester')
        .eq('subject', 'ROOT')

    // Create a set for lightning-fast lookup
    const existingSet = new Set(
        (existingFolders ?? []).map(f => `${f.department}-${f.year}-${f.semester}-${f.name.toLowerCase()}`)
    )

    // Filter out duplicates
    const recordsToInsert = inserts.filter(record => {
        const key = `${record.department}-${record.year}-${record.semester}-${record.name.toLowerCase()}`
        return !existingSet.has(key)
    })

    let successCount = 0
    let errors: any[] = []

    if (recordsToInsert.length > 0) {
        // Supabase supports bulk insert
        const { error: insertErr } = await supabase
            .from('note_folders')
            .insert(recordsToInsert)
        
        if (insertErr) {
            errors.push({ error: insertErr })
        } else {
            successCount = recordsToInsert.length
        }
    }

    return NextResponse.json({ 
        message: 'Migration Complete', 
        attempted: inserts.length, 
        inserted: successCount, 
        errors 
    })
}
