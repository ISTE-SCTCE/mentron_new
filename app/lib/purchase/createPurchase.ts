import { createClient } from '@/app/lib/supabase/client'

export interface PurchasePayload {
    itemId: string
    sellerId: string
    buyerId: string
    price: number
    note?: string
}

export interface PurchaseResult {
    success: boolean
    orderId?: string
    error?: string
}

/**
 * createPurchase — payment abstraction layer.
 *
 * Currently simulates a successful payment and writes the order directly.
 * To integrate Stripe or Razorpay later, add the payment step before
 * the supabase inserts below — no other files need to change.
 */
export async function createPurchase(payload: PurchasePayload): Promise<PurchaseResult> {
    const supabase = createClient()

    // ── Payment step (future: await stripe.charge() / razorpay.createOrder()) ──
    // Simulated: always succeeds for now
    const paymentSuccess = true
    if (!paymentSuccess) {
        return { success: false, error: 'Payment failed. Please try again.' }
    }

    // ── 1. Insert order record ──
    const { data: order, error: orderErr } = await supabase
        .from('marketplace_orders')
        .insert({
            item_id: payload.itemId,
            seller_id: payload.sellerId,
            buyer_id: payload.buyerId,
            price: payload.price,
            note: payload.note?.trim() || null,
            status: 'completed',
        })
        .select('id')
        .single()

    if (orderErr) {
        console.error('Order insert error:', orderErr)
        return { success: false, error: orderErr.message }
    }

    // ── 2. Mark item as sold ──
    const { error: updateErr } = await supabase
        .from('marketplace_items')
        .update({ is_sold: true })
        .eq('id', payload.itemId)

    if (updateErr) {
        console.error('Mark sold error:', updateErr)
        // Order is created — don't fail the whole flow, just log it
    }

    return { success: true, orderId: order.id }
}
