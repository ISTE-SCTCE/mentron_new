import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { isCoreMember } from '@/app/lib/utils/coreAuth'
import { revalidatePath } from 'next/cache'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()

    // Auth check
    const isAuthorized = await isCoreMember()
    if (!isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized to edit folders.' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { name } = body

        if (!name || name.trim() === '') {
            return NextResponse.json({ error: 'Folder name is required.' }, { status: 400 })
        }

        const trimmedName = name.trim()

        // Get the current folder to see if it's a ROOT alias
        const { data: existingFolder } = await supabase
            .from('note_folders')
            .select('name, subject')
            .eq('id', id)
            .single()

        if (!existingFolder) {
            return NextResponse.json({ error: 'Folder not found.' }, { status: 404 })
        }

        const oldName = existingFolder.name

        // Update the folder name
        const { error: updateErr } = await supabase
            .from('note_folders')
            .update({ name: trimmedName })
            .eq('id', id)

        if (updateErr) throw updateErr

        // Cascade update to notes table if it's a Root Subject folder
        if (existingFolder.subject === 'ROOT') {
            const { error: cascadeErr } = await supabase
                .from('notes')
                .update({ subject: trimmedName })
                .eq('subject', oldName)

            if (cascadeErr) {
                console.error('Failed to cascade subject rename on notes table:', cascadeErr)
                // We won't throw because the folder update succeeded, but ideally it should
            }

            // Also cascade rename to any custom folders that belonged to this subject!
            const { error: cascadeFolderErr } = await supabase
                .from('note_folders')
                .update({ subject: trimmedName })
                .eq('subject', oldName)

            if (cascadeFolderErr) {
                console.error('Failed to cascade subject rename on note_folders table:', cascadeFolderErr)
            }
        }

        revalidatePath('/notes', 'layout')
        
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()

    // Auth check
    const isAuthorized = await isCoreMember()
    if (!isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized to delete folders.' }, { status: 403 })
    }

    try {
        // Find existing to know if it's ROOT
        const { data: existingFolder } = await supabase
            .from('note_folders')
            .select('name, subject')
            .eq('id', id)
            .single()

        if (!existingFolder) {
             return NextResponse.json({ error: 'Folder not found.' }, { status: 404 })
        }

        // If it's a ROOT folder, check if notes exist for this subject
        if (existingFolder.subject === 'ROOT') {
            const { count } = await supabase
                .from('notes')
                .select('id', { count: 'exact', head: true })
                .eq('subject', existingFolder.name)

            if (count && count > 0) {
                return NextResponse.json({ error: 'Cannot delete subject. It contains notes.' }, { status: 400 })
            }
        }

        // Technically this should ideally check if folder has notes or cascade delete, 
        // assuming Supabase handles foreign keys with Cascade or we allow deleting empty folders.
        const { error } = await supabase
            .from('note_folders')
            .delete()
            .eq('id', id)

        if (error) throw error

        revalidatePath('/notes', 'layout')

        return NextResponse.json({ success: true })
    } catch (err: any) {
        // e.g. violates foreign key constraint if not cascade
        if (err.code === '23503') {
            return NextResponse.json({ error: 'Cannot delete folder. It contains notes.' }, { status: 400 })
        }
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
