import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MarketplaceClient } from './MarketplaceClient'
import { MarketplaceListing } from './types'

export const dynamic = 'force-dynamic'

export default async function MarketplacePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch live listings with seller profile information (matching Flutter query)
    const { data: listings, error } = await supabase
        .from('marketplace_listings')
        .select('*, profiles(full_name, department, admission_year)')
        .eq('status', 'live')
        .order('created_at', { ascending: false })
        .limit(60)

    if (error) {
        console.error('Error fetching marketplace listings:', error)
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

    return (
        <MarketplaceClient
            initialListings={(listings as MarketplaceListing[]) || []}
            currentUserId={user.id}
            currentUserRole={profile?.role || 'member'}
        />
    )
}
