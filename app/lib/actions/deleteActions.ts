'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteNote(noteId: string) {
    const supabase = await createClient()

    const { data: note } = await supabase
        .from('notes')
        .select('file_url, profile_id')
        .eq('id', noteId)
        .single()

    if (!note) return { error: 'Note not found' }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check if user is author OR an exec
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isExec = profile?.role === 'exec' || profile?.role === 'admin'

    if (user.id !== note.profile_id && !isExec) return { error: 'Unauthorized' }

    // Try to delete file
    try {
        if (note.file_url) {
            const match = note.file_url.match(/notes_bucket\/(.+)/)
            if (match && match[1]) {
                const filePath = match[1]
                await supabase.storage.from('notes_bucket').remove([filePath])
            }
        }
    } catch (e) {
        console.error("Storage delete error", e)
    }

    const { error } = await supabase.from('notes').delete().eq('id', noteId)
    if (error) return { error: error.message }

    revalidatePath('/notes')
    return { success: true }
}

export async function deleteProject(projectId: string) {
    const supabase = await createClient()

    const { data: project } = await supabase
        .from('projects')
        .select('posted_by')
        .eq('id', projectId)
        .single()

    if (!project) return { error: 'Project not found' }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check if user is author OR an exec
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isExec = profile?.role === 'exec' || profile?.role === 'admin'

    if (user.id !== project.posted_by && !isExec) return { error: 'Unauthorized' }

    // Delete CVs of associated applications
    const { data: apps } = await supabase
        .from('project_applications')
        .select('cv_url')
        .eq('project_id', projectId)

    if (apps && apps.length > 0) {
        const filesToRemove = apps.map(app => {
            const match = app.cv_url?.match(/cv_bucket\/(.+)/)
            return match ? match[1] : null
        }).filter(Boolean) as string[]

        if (filesToRemove.length > 0) {
            await supabase.storage.from('cv_bucket').remove(filesToRemove)
        }
    }

    const { error } = await supabase.from('projects').delete().eq('id', projectId)
    if (error) return { error: error.message }

    revalidatePath('/projects')
    return { success: true }
}

export async function deleteMarketplaceItem(itemId: string) {
    const supabase = await createClient()

    const { data: item } = await supabase
        .from('marketplace_items')
        .select('image_url, seller_id')
        .eq('id', itemId)
        .single()

    if (!item) return { error: 'Item not found' }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check if user is author OR an exec
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isExec = profile?.role === 'exec' || profile?.role === 'admin'

    if (user.id !== item.seller_id && !isExec) return { error: 'Unauthorized' }

    try {
        if (item.image_url) {
            const match = item.image_url.match(/marketplace_bucket\/(.+)/)
            if (match && match[1]) {
                await supabase.storage.from('marketplace_bucket').remove([match[1]])
            }
        }
    } catch (e) {
        console.error("Storage delete error", e)
    }

    const { error } = await supabase.from('marketplace_items').delete().eq('id', itemId)
    if (error) return { error: error.message }

    revalidatePath('/marketplace')
    return { success: true }
}
