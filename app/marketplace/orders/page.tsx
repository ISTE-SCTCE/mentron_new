import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { OrdersClient } from './OrdersClient'

export default async function OrdersPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // My Purchases: orders where I am the buyer
    const { data: myPurchases } = await supabase
        .from('marketplace_orders')
        .select(`
            id, amount, order_status, utr_number, created_at,
            marketplace_listings ( id, title, images, seller_id ),
            profiles!buyer_id ( full_name )
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })

    // Find my listing IDs to get orders received for my listings
    const { data: myListings } = await supabase
        .from('marketplace_listings')
        .select('id')
        .eq('seller_id', user.id)

    const listingIds = (myListings || []).map((l: any) => l.id)

    let ordersReceived: any[] = []
    if (listingIds.length > 0) {
        const { data: received } = await supabase
            .from('marketplace_orders')
            .select(`
                id, amount, order_status, utr_number, created_at,
                marketplace_listings ( id, title, images, seller_id ),
                profiles!buyer_id ( full_name )
            `)
            .in('listing_id', listingIds)
            .order('created_at', { ascending: false })
        ordersReceived = received || []
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8 pt-20 sm:pt-28 md:pt-32 text-[#ededed]">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <header className="mb-8 sm:mb-12">
                    <Link href="/marketplace" className="text-gray-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest inline-flex items-center gap-1.5 group">
                        <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Back to Marketplace
                    </Link>
                    <p className="text-[10px] font-black tracking-[0.3em] text-cyan-400 uppercase mt-4 mb-2 flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-gradient-to-r from-purple-500 to-cyan-400 inline-block" />
                        TradeHub
                    </p>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white">My Orders</h1>
                </header>

                {/* Animated orders — client component */}
                <OrdersClient
                    myPurchases={(myPurchases ?? []) as any}
                    ordersReceived={(ordersReceived ?? []) as any}
                />
            </div>
        </div>
    )
}
