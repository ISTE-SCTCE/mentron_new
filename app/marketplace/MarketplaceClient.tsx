'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingBag, Plus, Package } from 'lucide-react'
import { PurchaseModal } from '@/app/components/PurchaseModal'

const CATEGORIES = ['All', 'Books', 'Electronics', 'Stationery', 'Clothes', 'Others']

const CAT_COLORS: Record<string, string> = {
  Books: '#6C63FF', Electronics: '#FF8C69', Stationery: '#4ECDC4',
  Clothes: '#FF6B9D', Others: '#74B9FF',
}

interface Item {
  id: string
  title: string
  description?: string
  price: number
  category?: string
  condition?: string
  seller_id: string
  created_at: string
  profiles?: { full_name: string | null }
  image_url?: string
}

export function MarketplaceClient({ items, userId, userName }: { items: Item[], userId: string, userName: string }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  const filtered = items.filter(item => {
    const q = search.toLowerCase()
    const matchSearch = !q || item.title?.toLowerCase().includes(q)
    const matchCat = category === 'All' || item.category === category
    return matchSearch && matchCat
  })

  return (
    <div className="min-h-screen" style={{ background: '#F8F6FF', paddingBottom: 104, position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '48px 20px 16px' }}>
        <p style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: 9, letterSpacing: 2, color: '#FF8C69', marginBottom: 4 }}>COMMUNITY MARKETPLACE</p>
        <h1 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 28, color: '#2D2845', margin: 0 }}>Marketplace</h1>
        <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: '#8B85A8', marginTop: 4 }}>Buy and sell within the Mentron community.</p>
      </div>

      {/* Search */}
      <div style={{ padding: '0 20px 16px', position: 'relative' }}>
        <Search size={18} color="#8B85A8" style={{ position: 'absolute', left: 34, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…" className="flutter-input" style={{ paddingLeft: 44 }} />
      </div>

      {/* Category chips */}
      <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 20px 20px' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} className={`chip ${category === c ? 'active' : ''}`}>{c}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ padding: '0 20px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Package size={48} color="#B8B4D0" style={{ marginBottom: 12 }} />
            <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 18, color: '#2D2845', margin: '0 0 8px' }}>Marketplace is empty</p>
            <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: '#8B85A8' }}>Be the first to list an item!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((item, i) => {
              const color = CAT_COLORS[item.category || 'Others'] || '#6C63FF'
              return (
                <div 
                  key={item.id} 
                  className="glass-card" 
                  style={{ padding: 14, cursor: 'pointer' }}
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Item image */}
                  <div style={{
                    width: '100%', height: 140, borderRadius: 16, marginBottom: 10,
                    overflow: 'hidden',
                    background: `linear-gradient(135deg, ${color}22, ${color}11)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e: any) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <ShoppingBag size={32} color={color} />
                    )}
                  </div>
                  <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 13, color: '#2D2845', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 15, color, margin: 0 }}>₹{item.price}</p>
                    {item.category && (
                      <span style={{ background: `${color}1A`, color, fontSize: 9, fontFamily: 'Inter', fontWeight: 700, padding: '3px 8px', borderRadius: 50 }}>
                        {item.category}
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 11, color: '#8B85A8', margin: '4px 0 0' }}>
                    by {item.profiles?.full_name || 'Member'}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link href="/marketplace/new">
        <button
          style={{
            position: 'fixed', right: 24, bottom: 100,
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFAA85, #FF8C69)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(255,140,105,0.35)',
            zIndex: 40,
          }}
        >
          <Plus size={24} color="white" />
        </button>
      </Link>

      {/* Purchase Dialog */}
      {selectedItem && (
        <PurchaseModal
          item={selectedItem as any}
          buyerId={userId}
          buyerName={userName}
          onClose={() => setSelectedItem(null)}
          onSuccess={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}
