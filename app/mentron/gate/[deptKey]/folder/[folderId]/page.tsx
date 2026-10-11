import { notFound } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import { getPermissions } from '@/app/lib/utils/coreAuth'
import { FolderNotesClient } from './FolderNotesClient'

export const dynamic = 'force-dynamic'

export default async function GateFolderPage({
    params,
}: {
    params: Promise<{ deptKey: string; folderId: string }>
}) {
    const { deptKey, folderId } = await params
    const normalizedKey = deptKey.toUpperCase()
    const supabase = await createClient()

    // 1. Fetch Department Details
    const { data: department } = await supabase
        .from('gate_departments')
        .select('*')
        .eq('key', normalizedKey)
        .single()

    if (!department) {
        notFound()
    }

    // 2. Fetch Folder Details
    const { data: folder } = await supabase
        .from('gate_folders')
        .select('*')
        .eq('id', folderId)
        .eq('department_id', department.id)
        .single()

    if (!folder) {
        notFound()
    }

    // 3. Fetch Notes inside folder with profile names
    const { data: notes } = await supabase
        .from('gate_notes')
        .select('*, profiles(full_name)')
        .eq('folder_id', folder.id)
        .order('created_at', { ascending: false })

    // 4. Permissions check
    const { data: { user } } = await supabase.auth.getUser()
    let isPrivileged = false

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        isPrivileged = profile?.role === 'exec' || profile?.role === 'core' || profile?.role === 'admin'
    }

    const permissions = await getPermissions()
    const canUploadNotes = isPrivileged || permissions.can_upload_notes === true

    return (
        <FolderNotesClient
            deptKey={department.key}
            folderId={folder.id}
            folderName={folder.name}
            initialNotes={notes || []}
            canUploadNotes={canUploadNotes}
            isPrivileged={isPrivileged}
            currentUserId={user?.id ?? null}
        />
    )
}
