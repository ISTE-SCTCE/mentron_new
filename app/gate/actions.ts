'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getPermissions } from '@/app/lib/utils/coreAuth'

export async function createGateDepartment(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be logged in.' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isPrivileged = profile?.role === 'exec' || profile?.role === 'core' || profile?.role === 'admin'
    if (!isPrivileged) {
        return { error: 'Only executive and core members can add departments.' }
    }

    const key = (formData.get('key') as string || '').trim().toUpperCase()
    const label = (formData.get('label') as string || '').trim()
    const emoji = (formData.get('emoji') as string || '🏛️').trim()
    const color = (formData.get('color') as string || 'cyan').trim()

    if (!key || !label) {
        return { error: 'Department code and name are required.' }
    }

    const { data, error } = await supabase
        .from('gate_departments')
        .insert({ key, label, emoji, color })
        .select()
        .single()

    if (error) {
        if (error.code === '23505') {
            return { error: `Department code '${key}' already exists.` }
        }
        return { error: error.message }
    }

    revalidatePath('/gate')
    return { success: true, department: data }
}

export async function createGateFolder(departmentId: string, name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be logged in.' }

    const permissions = await getPermissions()
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isPrivileged = profile?.role === 'exec' || profile?.role === 'core' || profile?.role === 'admin'
    const canCreate = isPrivileged || permissions.can_upload_notes === true

    if (!canCreate) {
        return { error: 'You do not have permission to create folders.' }
    }

    const trimmedName = (name || '').trim()
    if (!trimmedName) {
        return { error: 'Folder name is required.' }
    }

    const { data, error } = await supabase
        .from('gate_folders')
        .insert({
            department_id: departmentId,
            name: trimmedName,
            created_by: user.id,
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/gate', 'layout')
    return { success: true, folder: data }
}

export async function saveGateNoteMetadata(payload: {
    folderId: string
    title: string
    description?: string
    fileKey: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be logged in.' }

    const permissions = await getPermissions()
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isPrivileged = profile?.role === 'exec' || profile?.role === 'core' || profile?.role === 'admin'
    const canUpload = isPrivileged || permissions.can_upload_notes === true

    if (!canUpload) {
        return { error: 'You do not have permission to upload notes.' }
    }

    const { folderId, title, description, fileKey } = payload
    if (!folderId || !title || !fileKey) {
        return { error: 'Missing required note metadata.' }
    }

    const fileUrl = `/api/files/${fileKey}`

    const { data, error } = await supabase
        .from('gate_notes')
        .insert({
            folder_id: folderId,
            title: title.trim(),
            description: description?.trim() || null,
            file_url: fileUrl,
            profile_id: user.id,
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/gate', 'layout')
    return { success: true, note: data }
}
