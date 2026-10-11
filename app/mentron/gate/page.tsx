import { createClient } from '@/app/lib/supabase/server'
import { GateLandingClient } from './GateLandingClient'

export const dynamic = 'force-dynamic'

export default async function GatePage() {
    const supabase = await createClient()

    // 1. Fetch departments with folders count
    const { data: departments, error } = await supabase
        .from('gate_departments')
        .select('*, gate_folders(id)')
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching gate departments:', error)
    }

    // 2. Auth check for privileged role
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

    return (
        <GateLandingClient
            initialDepartments={departments || []}
            isPrivileged={isPrivileged}
        />
    )
}
