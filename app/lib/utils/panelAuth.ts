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

    if (!user?.email) return false

    const { data, error } = await supabase
        .from('panel_members')
        .select('id')
        .eq('name', user.email)
        .maybeSingle()

    if (error || !data) return false
    return true
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
