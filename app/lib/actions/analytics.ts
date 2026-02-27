'use server'

import { createClient } from '@/app/lib/supabase/server'

export async function logInteraction(
    itemType: 'note' | 'marketplace_item' | 'project',
    itemId: string,
    interactionType: 'view' | 'download'
) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('interaction_logs')
        .insert({
            user_id: user.id,
            item_type: itemType,
            item_id: itemId,
            interaction_type: interactionType
        })

    if (error) {
        console.error('Logging error:', error)
        return { error: error.message }
    }

    return { success: true }
}
