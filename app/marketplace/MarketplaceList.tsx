'use client'

import { useState } from 'react'
import { PurchaseModal } from '@/app/components/PurchaseModal'
import { InteractionTracker } from '@/app/components/InteractionTracker'
import { DeleteButton } from '@/app/components/DeleteButton'
import { deleteMarketplaceItem } from '@/app/lib/actions/deleteActions'

interface Item {
    id: string
    title: string
    description: string
    price: number
    image_url: string
    seller_id: string
    is_sold: boolean
    created_at: string
    profiles?: { full_name: string | null }
}

interface Props {
    items: Item[]
    userId: string
    userName: string
    userRole: string
    purchasedItemIds: string[]
}

function ItemCard({
    item,
    isOwn,
    isExec,
    isSold,
    hasPurchased,
    onBuy,
}: {
    item: Item
    isOwn: boolean
    isExec: boolean
    isSold: boolean
    hasPurchased: boolean
    onBuy: () => void
}) {
    const sold = isSold || hasPurchased

    return (
        <InteractionTracker itemType="marketplace_item" itemId={item.id} interactionType="view" trigger="mount">
            <div className="glass-card overflow-hidden group flex flex-col h-full !p-0">
                {/* Image */}
                <div className="aspect-[4/5] relative overflow-hidden p-3">
                    <div className="w-full h-full rounded-[2rem] overflow-hidden">
                        <img
                            src={item.image_url}
                            alt={item.title}
                            className={`object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ${sold ? 'grayscale opacity-60' : ''}`}
                        />
                    </div>
                    {/* Price badge */}
                    <div className="absolute top-6 right-6 bg-white text-black font-black px-4 py-2 rounded-xl text-xs shadow-xl scale-90 group-hover:scale-100 transition-all">
                        ₹{item.price.toLocaleString('en-IN')}
                    </div>
                    {/* Sold overlay */}
                    {sold && (
                        <div className="absolute inset-3 rounded-[2rem] bg-black/50 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-white font-black text-lg uppercase tracking-widest">Sold</span>
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col flex-1">
                    <h2 className="text-lg font-black text-white group-hover:text-glow transition-all mb-1 line-clamp-1">{item.title}</h2>
                    <p className="text-gray-400 text-xs font-medium mb-4 line-clamp-2 leading-relaxed flex-1">{item.description}</p>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                        {/* Seller */}
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[8px] text-blue-400 font-black uppercase shrink-0">
                                {item.profiles?.full_name?.[0] ?? '?'}
                            </div>
                            <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase truncate">
                                {item.profiles?.full_name || 'Student'}
                            </span>
                        </div>

                        {/* Action */}
                        {isOwn || isExec ? (
                            <div className="flex items-center gap-2 shrink-0">
                                {isOwn && (
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
                                        Your Listing
                                    </span>
                                )}
                                <DeleteButton onDelete={() => deleteMarketplaceItem(item.id)} itemName="product" />
                            </div>
                        ) : sold ? (
                            <span className="shrink-0 text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-xl">
                                {hasPurchased ? 'Purchased ✓' : 'Sold'}
                            </span>
                        ) : (
                            <button
                                onClick={onBuy}
                                className="shrink-0 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-400 active:scale-95 shadow-lg shadow-emerald-500/20 transition-all"
                            >
                                Buy Now
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </InteractionTracker>
    )
}

export function MarketplaceList({ items, userId, userName, userRole, purchasedItemIds }: Props) {
    const [modalItem, setModalItem] = useState<Item | null>(null)
    const [soldIds, setSoldIds] = useState<Set<string>>(new Set(
        items.filter(i => i.is_sold).map(i => i.id)
    ))
    const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set(purchasedItemIds))
    const [successItem, setSuccessItem] = useState<Item | null>(null)

    const myListings = items.filter(i => i.seller_id === userId)
    const otherItems = items.filter(i => i.seller_id !== userId)
    const isExec = userRole === 'exec' || userRole === 'core' || userRole === 'admin'

    const handleSuccess = (item: Item) => {
        setSoldIds(prev => new Set([...prev, item.id]))
        setPurchasedIds(prev => new Set([...prev, item.id]))
        setSuccessItem(item)
        setModalItem(null)
        setTimeout(() => setSuccessItem(null), 4000)
    }

    return (
        <>
            {/* Success toast */}
            {successItem && (
                <div className="fixed bottom-8 right-8 z-[9997] glass bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-lg">
                    <span className="text-emerald-400 text-2xl">✓</span>
                    <div>
                        <p className="text-sm font-black text-white">Order Placed!</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">"{successItem.title}" — ₹{successItem.price.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-gray-600 uppercase tracking-widest">Contact the seller to arrange pickup</p>
                    </div>
                </div>
            )}

            {/* ── My Listings ── */}
            <section className="mb-16">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase mb-1">Your Items</p>
                        <h2 className="text-2xl font-black text-white">My Listings</h2>
                    </div>
                    <a
                        href="/marketplace/new"
                        className="flex items-center gap-2 glass glass-hover px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest text-blue-400 border border-blue-500/20 transition-all"
                    >
                        ＋ List Item
                    </a>
                </div>

                {myListings.length === 0 ? (
                    <div className="glass-card border border-dashed border-white/10 py-14 text-center">
                        <p className="text-3xl mb-3">🏪</p>
                        <p className="text-gray-500 font-bold text-sm">You haven't listed anything yet.</p>
                        <a href="/marketplace/new" className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                            ＋ Sell Something
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {myListings.map(item => (
                            <ItemCard
                                key={item.id}
                                item={item}
                                isOwn={true}
                                isExec={isExec}
                                isSold={soldIds.has(item.id)}
                                hasPurchased={false}
                                onBuy={() => { }}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* ── Explore ── */}
            <section>
                <div className="mb-6">
                    <p className="text-[10px] font-black tracking-[0.3em] text-purple-500 uppercase mb-1">Browse</p>
                    <h2 className="text-2xl font-black text-white">Explore Marketplace</h2>
                    <p className="text-gray-500 text-xs font-medium mt-1">
                        {otherItems.filter(i => !soldIds.has(i.id)).length} item{otherItems.filter(i => !soldIds.has(i.id)).length !== 1 ? 's' : ''} available
                    </p>
                </div>

                {otherItems.length === 0 ? (
                    <div className="glass-card border border-dashed border-white/10 py-14 text-center">
                        <p className="text-3xl mb-3">🔭</p>
                        <p className="text-gray-500 font-bold text-sm">Market is quiet today.</p>
                        <p className="text-gray-700 text-xs mt-1">New listings from others will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {otherItems.map(item => (
                            <ItemCard
                                key={item.id}
                                item={item}
                                isOwn={false}
                                isExec={isExec}
                                isSold={soldIds.has(item.id)}
                                hasPurchased={purchasedIds.has(item.id)}
                                onBuy={() => setModalItem(item)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Purchase Modal */}
            {modalItem && (
                <PurchaseModal
                    item={modalItem}
                    buyerId={userId}
                    buyerName={userName}
                    onClose={() => setModalItem(null)}
                    onSuccess={() => handleSuccess(modalItem)}
                />
            )}
        </>
    )
}
