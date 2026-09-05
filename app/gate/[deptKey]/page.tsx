import { notFound } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import { getPermissions } from '@/app/lib/utils/coreAuth'
import { DeptFoldersClient } from './DeptFoldersClient'

export const dynamic = 'force-dynamic'

export default async function GateDepartmentPage({
    params,
}: {
    params: Promise<{ deptKey: string }>
}) {
    const { deptKey } = await params
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

    // 2. Fetch Folders with notes count and creator details
    const { data: folders } = await supabase
        .from('gate_folders')
        .select('*, gate_notes(id), profiles(full_name)')
        .eq('department_id', department.id)
        .order('created_at', { ascending: true })

    // 3. Auth and permissions check
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
    const canCreateFolder = isPrivileged || permissions.can_upload_notes === true

    return (
        <DeptFoldersClient
            department={department}
            initialFolders={folders || []}
            canCreateFolder={canCreateFolder}
            isPrivileged={isPrivileged}
            currentUserId={user?.id ?? null}
        />
    )
}
