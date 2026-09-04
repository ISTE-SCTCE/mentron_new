'use client'

import Link from 'next/link'
import { Search, Plus, Package } from 'lucide-react'
import { MarketplaceTheme } from '../theme'

interface Props {
  searchQuery: string
  onSearchChange: (q: string) => void
}

export function MarketplaceGradientHeader({ searchQuery, onSearchChange }: Props) {
  return (
    <div
      className="relative overflow-hidden rounded-b-[2rem] sm:rounded-b-[2.5rem] shadow-xl text-white pt-24 sm:pt-28 pb-8 px-5 sm:px-8 md:px-12"
      style={{ background: MarketplaceTheme.heroGradient }}
    >
      {/* ── Decorative background blobs (top right) ── */}
      <div className="absolute -top-6 -right-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none blur-[1px]" />
      <div className="absolute top-6 right-4 w-20 h-20 rounded-full bg-white/[0.07] pointer-events-none blur-[1px]" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-5">
        {/* Top row: Title + Actions */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-white/75">
              MENTRON
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mt-1">
              Marketplace
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/marketplace/orders"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md transition-all shadow-md active:scale-95"
            >
              <Package size={15} />
              <span className="hidden sm:inline">My Orders</span>
            </Link>

            <Link
              href="/marketplace/new"
              className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 border border-white/40 flex items-center justify-center text-white backdrop-blur-md transition-all shadow-md active:scale-95 group"
              title="List an item"
            >
              <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
            </Link>
          </div>
        </div>

        {/* Search bar (Solid white pill matching Flutter) */}
        <div className="pt-1">
          <div className="relative flex items-center w-full bg-white rounded-full shadow-lg shadow-black/10 transition-all focus-within:ring-4 focus-within:ring-white/30">
            <Search size={18} className="absolute left-4 text-[#8D8AA0] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search textbooks, parts..."
              className="w-full h-12 sm:h-13 pl-11 pr-5 bg-transparent rounded-full text-sm sm:text-base font-medium text-[#2C2A45] placeholder-[#8D8AA0] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="mr-3 px-2 py-1 text-xs font-bold text-[#8D8AA0] hover:text-[#2C2A45]"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
