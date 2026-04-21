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

        const { error } = await supabase
            .from('note_folders')
            .update({ name: name.trim() })
            .eq('id', id)

        if (error) throw error

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
