import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function OrdersPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // My Purchases: orders where I am the buyer
    const { data: myPurchases } = await supabase
        .from('marketplace_orders')
        .select(`
            id, price, status, note, created_at,
            marketplace_items ( id, title, image_url ),
            profiles!marketplace_orders_seller_id_fkey ( full_name )
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })

    // Orders Received: orders where I am the seller
    const { data: ordersReceived } = await supabase
        .from('marketplace_orders')
        .select(`
            id, price, status, note, created_at,
            marketplace_items ( id, title, image_url ),
            profiles!marketplace_orders_buyer_id_fkey ( full_name )
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

    const statusColor = (s: string) =>
        s === 'completed' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
            : s === 'cancelled' ? 'text-red-400 bg-red-500/10 border-red-500/20'
                : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'

    return (
        <div className="min-h-screen p-8 text-[#ededed]">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <header className="mb-12">
                    <Link href="/marketplace" className="text-gray-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest">
                        ← Marketplace
                    </Link>
                    <p className="text-[10px] font-black tracking-[0.3em] text-purple-500 uppercase mt-4 mb-2">TradeHub</p>
                    <h1 className="text-4xl font-black tracking-tighter text-white">My Orders</h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* ── My Purchases ── */}
                    <section>
                        <div className="mb-6">
                            <p className="text-[10px] font-black tracking-widest text-blue-500 uppercase mb-1">What I Bought</p>
                            <h2 className="text-2xl font-black text-white">Purchases</h2>
                            <p className="text-gray-600 text-xs mt-1">{myPurchases?.length ?? 0} order{myPurchases?.length !== 1 ? 's' : ''}</p>
                        </div>

                        {!myPurchases?.length ? (
                            <div className="glass rounded-[2rem] border border-dashed border-white/10 py-12 text-center">
                                <p className="text-3xl mb-2">🛍️</p>
                                <p className="text-gray-500 font-bold text-sm">No purchases yet.</p>
                                <Link href="/marketplace" className="mt-3 inline-block text-blue-500 text-xs font-black uppercase tracking-widest hover:text-white transition-colors">
                                    Browse Items →
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myPurchases.map((order: any) => (
                                    <div key={order.id} className="glass rounded-2xl p-4 flex gap-4 items-start border border-white/5">
                                        <img
                                            src={order.marketplace_items?.image_url}
                                            alt={order.marketplace_items?.title}
                                            className="w-14 h-14 rounded-xl object-cover shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-white text-sm truncate">{order.marketplace_items?.title}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                                                Seller: {order.profiles?.full_name || '—'}
                                            </p>
                                            {order.note && (
                                                <p className="text-[10px] text-gray-600 mt-1 italic line-clamp-1">"{order.note}"</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <p className="font-black text-white text-sm">₹{Number(order.price).toLocaleString('en-IN')}</p>
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${statusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                            <p className="text-[9px] text-gray-700">
                                                {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ── Orders Received ── */}
                    <section>
                        <div className="mb-6">
                            <p className="text-[10px] font-black tracking-widest text-emerald-500 uppercase mb-1">What I Sold</p>
                            <h2 className="text-2xl font-black text-white">Orders Received</h2>
                            <p className="text-gray-600 text-xs mt-1">{ordersReceived?.length ?? 0} order{ordersReceived?.length !== 1 ? 's' : ''}</p>
                        </div>

                        {!ordersReceived?.length ? (
                            <div className="glass rounded-[2rem] border border-dashed border-white/10 py-12 text-center">
                                <p className="text-3xl mb-2">📦</p>
                                <p className="text-gray-500 font-bold text-sm">No orders received yet.</p>
                                <Link href="/marketplace/new" className="mt-3 inline-block text-emerald-500 text-xs font-black uppercase tracking-widest hover:text-white transition-colors">
                                    List an Item →
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {ordersReceived.map((order: any) => (
                                    <div key={order.id} className="glass rounded-2xl p-4 flex gap-4 items-start border border-white/5">
                                        <img
                                            src={order.marketplace_items?.image_url}
                                            alt={order.marketplace_items?.title}
                                            className="w-14 h-14 rounded-xl object-cover shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-white text-sm truncate">{order.marketplace_items?.title}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                                                Buyer: {order.profiles?.full_name || '—'}
                                            </p>
                                            {order.note && (
                                                <p className="text-[10px] text-gray-600 mt-1 italic line-clamp-2">"{order.note}"</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <p className="font-black text-white text-sm">₹{Number(order.price).toLocaleString('en-IN')}</p>
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${statusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                            <p className="text-[9px] text-gray-700">
                                                {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    )
}
