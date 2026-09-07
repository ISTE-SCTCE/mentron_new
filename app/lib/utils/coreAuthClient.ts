import { createClient } from '@/app/lib/supabase/client'

/**
 * Returns the current user's granular permissions on the client side.
 */
export async function getPermissionsClient(): Promise<Record<string, boolean>> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return {}
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('permissions, iste_position, role')
        .eq('id', user.id)
        .single()
    
    // Leadership roles get all permissions by default
    if (profile?.iste_position === 'Chairman' || profile?.iste_position === 'Vice Chairman') {
        return {
            "can_see_member_info": true,
            "can_delete_account": true,
            "can_upload_notes": true,
            "can_promote_demote": true
        }
    }

    const perms = profile?.permissions || {}
    const isExecOrCore = profile?.role === 'core' || profile?.role === 'exec' || profile?.role === 'admin'

    return {
        ...perms,
        // Force can_upload_notes to false for normal members, true for core/exec/admin by default
        can_upload_notes: isExecOrCore ? (perms.can_upload_notes ?? true) : false
    }
}
