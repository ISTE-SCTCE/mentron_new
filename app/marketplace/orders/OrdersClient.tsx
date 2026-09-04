'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp, scaleIn } from '@/app/lib/animations'

interface Order {
  id: string
  price: number
  status: string
  note: string | null
  created_at: string
  marketplace_items: { id: string; title: string; image_url: string } | null
  profiles: { full_name: string } | null
}

interface OrdersClientProps {
  myPurchases: Order[]
  ordersReceived: Order[]
}

const statusColor = (s: string) =>
  s === 'completed'
    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    : s === 'cancelled'
    ? 'text-red-400 bg-red-500/10 border-red-500/20'
    : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'

function OrderCard({ order, label }: { order: Order; label: 'Seller' | 'Buyer' }) {
  const isCompleted = order.status === 'completed'

  return (
    <motion.div
      variants={fadeInUp}
      className={`relative glass rounded-2xl p-4 flex gap-4 items-start border ${
        isCompleted ? 'border-emerald-500/20' : 'border-white/5'
      }`}
    >
      {/* Shimmer border on completed orders */}
      {isCompleted && (
        <motion.div
          className="absolute inset-0 rounded-2xl border border-emerald-400/30 pointer-events-none"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity }}
        />
      )}

      <img
        src={order.marketplace_items?.image_url}
        alt={order.marketplace_items?.title}
        className="w-14 h-14 rounded-xl object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-black text-white text-sm truncate">{order.marketplace_items?.title}</p>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
          {label}: {order.profiles?.full_name || '—'}
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
    </motion.div>
  )
}

export function OrdersClient({ myPurchases, ordersReceived }: OrdersClientProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
      {/* ── My Purchases ── */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-6"
        >
          <p className="text-[10px] font-black tracking-widest text-cyan-400 uppercase mb-1">What I Bought</p>
          <h2 className="text-xl sm:text-2xl font-black text-white">Purchases</h2>
          <p className="text-gray-500 text-xs mt-1">{myPurchases?.length ?? 0} order{myPurchases?.length !== 1 ? 's' : ''}</p>
        </motion.div>

        {!myPurchases?.length ? (
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="glass-card rounded-3xl border border-white/10 py-12 text-center p-6"
          >
            <svg className="w-10 h-10 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-gray-400 font-bold text-sm">No purchases yet.</p>
            <Link href="/marketplace" className="mt-3 inline-block text-cyan-400 text-xs font-black uppercase tracking-widest hover:text-cyan-300 transition-colors">
              Browse Items →
            </Link>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {myPurchases.map((order) => (
              <OrderCard key={order.id} order={order} label="Seller" />
            ))}
          </motion.div>
        )}
      </section>

      {/* ── Orders Received ── */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="mb-6"
        >
          <p className="text-[10px] font-black tracking-widest text-purple-400 uppercase mb-1">What I Sold</p>
          <h2 className="text-xl sm:text-2xl font-black text-white">Orders Received</h2>
          <p className="text-gray-500 text-xs mt-1">{ordersReceived?.length ?? 0} order{ordersReceived?.length !== 1 ? 's' : ''}</p>
        </motion.div>

        {!ordersReceived?.length ? (
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="glass-card rounded-3xl border border-white/10 py-12 text-center p-6"
          >
            <svg className="w-10 h-10 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-400 font-bold text-sm">No orders received yet.</p>
            <Link href="/marketplace/new" className="mt-3 inline-block text-purple-400 text-xs font-black uppercase tracking-widest hover:text-purple-300 transition-colors">
              List an Item →
            </Link>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {ordersReceived.map((order) => (
              <OrderCard key={order.id} order={order} label="Buyer" />
            ))}
          </motion.div>
        )}
      </section>
    </div>
  )
}
