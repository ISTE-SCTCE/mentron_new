import { createClient } from '@/app/lib/supabase/server'

/**
 * Returns true if the currently logged-in user's email
 * exists in the panel_members table.
 */
export async function isPanelMember(): Promise<boolean> {
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
    return profile?.role === 'panel'
}

/**
 * Returns the current user's email, or null.
 */
export async function getPanelMemberEmail(): Promise<string | null> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    return user?.email ?? null
}
