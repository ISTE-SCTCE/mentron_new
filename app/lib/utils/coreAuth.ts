import { createClient } from '@/app/lib/supabase/server'

/**
 * Returns true if the currently logged-in user's role
 * is 'core' or 'exec' (leadership roles).
 */
export async function isCoreMember(): Promise<boolean> {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    return profile?.role === 'core' || profile?.role === 'exec'
}

/**
 * Returns true if the currently logged-in user is Chairman or Vice Chairman.
 */
export async function isLeadershipPosition(): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('iste_position')
        .eq('id', user.id)
        .single()
    
    return profile?.iste_position === 'Chairman' || profile?.iste_position === 'Vice Chairman'
}

/**
 * Returns the current user's granular permissions.
 */
export async function getPermissions(): Promise<Record<string, boolean>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return {}
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('permissions, iste_position')
        .eq('id', user.id)
        .single()
    
    // Leadership roles get all permissions by default
    if (profile?.iste_position === 'Chairman' || profile?.iste_position === 'Vice Chairman') {
        return {
            "can_see_member_info": true,
            "can_delete_account": true,
            "can_upload_notes": true
        }
    }

    return profile?.permissions || {}
}

/**
 * Returns the current user's email, or null.
 */
export async function getCoreMemberEmail(): Promise<string | null> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    return user?.email ?? null
}
