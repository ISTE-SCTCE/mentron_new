import { createClient } from '@/app/lib/supabase/server'
import { MarketplaceClient } from './MarketplaceClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MarketplacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items } = await supabase
    .from('marketplace_items')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  return (
    <MarketplaceClient
      items={items || []}
      userId={user.id}
      userName={profile?.full_name || ''}
    />
  )
}
