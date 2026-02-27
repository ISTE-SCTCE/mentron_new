'use client'

import { useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { createPurchase } from '@/app/lib/purchase/createPurchase'

interface Item {
    id: string
    title: string
    price: number
    image_url: string
    seller_id: string
    profiles?: { full_name: string | null }
}

interface Props {
    item: Item
    buyerId: string
    buyerName: string
    onClose: () => void
    onSuccess: () => void
}

export function PurchaseModal({ item, buyerId, buyerName, onClose, onSuccess }: Props) {
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [confirmed, setConfirmed] = useState(false)

    const handlePurchase = async () => {
        if (!confirmed) { setConfirmed(true); return }

        setLoading(true)
        setError('')

        const result = await createPurchase({
            itemId: item.id,
            sellerId: item.seller_id,
            buyerId,
            price: item.price,
            note,
        })

        setLoading(false)

        if (!result.success) {
            setError(result.error ?? 'Something went wrong. Please try again.')
            setConfirmed(false)
            return
        }

        onSuccess()
    }

    return (
        <div className="fixed inset-0 z-[9998] flex items-start justify-center p-4 pt-32 overflow-y-auto">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md glass rounded-[2.5rem] p-8 border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-start mb-7">
                    <div>
                        <p className="text-[10px] font-black tracking-[0.3em] text-emerald-500 uppercase mb-1">Purchase</p>
                        <h2 className="text-2xl font-black text-white leading-tight">Confirm Order</h2>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl glass bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all">✕</button>
                </div>

                {/* Item summary */}
                <div className="flex gap-4 mb-7 glass bg-white/5 rounded-2xl p-4 border border-white/5">
                    <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-white text-sm leading-tight truncate">{item.title}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                            Sold by {item.profiles?.full_name || 'Seller'}
                        </p>
                        <p className="text-2xl font-black text-white mt-2">₹{item.price.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                {/* Buyer info */}
                <div className="mb-5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Buyer</label>
                    <div className="glass bg-white/5 rounded-xl px-4 py-3 text-sm font-medium text-gray-400 cursor-not-allowed">
                        {buyerName}
                    </div>
                </div>

                {/* Delivery / contact note */}
                <div className="mb-7">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                        Delivery Note <span className="text-gray-700 normal-case font-medium">(optional)</span>
                    </label>
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="e.g. Contact me on WhatsApp: 9876543210, or pick up at Block C..."
                        rows={3}
                        className="w-full glass bg-white/5 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                        <p className="text-red-400 text-xs font-bold">{error}</p>
                    </div>
                )}

                {/* CTA */}
                <button
                    onClick={handlePurchase}
                    disabled={loading}
                    className={`w-full font-black py-4 rounded-2xl text-sm uppercase tracking-widest transition-all active:scale-[0.98] ${confirmed && !loading
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-white text-black hover:bg-emerald-500 hover:text-white shadow-lg'
                        } disabled:bg-white/5 disabled:text-gray-600`}
                >
                    {loading ? 'Processing…' : confirmed ? '✓ Tap Again to Confirm' : `Buy Now · ₹${item.price.toLocaleString('en-IN')}`}
                </button>

                {!confirmed && (
                    <p className="text-center text-[10px] text-gray-600 mt-3 font-medium">
                        You'll be asked to confirm before the order is placed.
                    </p>
                )}
            </div>
        </div>
    )
}
