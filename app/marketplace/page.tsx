import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MarketplaceList } from './MarketplaceList'

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

    const { data: orders } = await supabase
        .from('marketplace_orders')
        .select('item_id')
        .eq('buyer_id', user.id)

    const purchasedIds = (orders || []).map(o => o.item_id)

    return (
        <div className="min-h-screen p-4 md:p-8 pt-20 md:pt-32 text-[#ededed]">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <p className="text-[10px] font-black tracking-[0.3em] text-purple-500 uppercase mb-2">TradeHub</p>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">Marketplace</h1>
                        <p className="text-gray-500 text-sm font-medium mt-1">Buy and sell items within the Mentron community.</p>
                    </div>
                    <Link
                        href="/marketplace/orders"
                        className="glass glass-hover px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest text-purple-400 border border-purple-500/20 transition-all"
                    >
                        📦 My Orders
                    </Link>
                </header>

                <MarketplaceList
                    items={items || []}
                    userId={user.id}
                    userName={profile?.full_name || ''}
                    userRole={profile?.role || 'member'}
                    purchasedItemIds={purchasedIds}
                />
            </div>
        </div>
    )
}


