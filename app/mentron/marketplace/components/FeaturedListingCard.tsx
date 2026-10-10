'use client'

import { User } from 'lucide-react'
import { MarketplaceListing } from '../types'
import { MarketplaceTheme, getConditionBadgeStyles } from '../theme'

interface Props {
  listing: MarketplaceListing
  onTap: (listing: MarketplaceListing) => void
}

export function FeaturedListingCard({ listing, onTap }: Props) {
  const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : null
  const conditionBadge = getConditionBadgeStyles(listing.condition)

  const sellerYear = listing.profiles?.admission_year
    ? ` ('${listing.profiles.admission_year.toString().slice(-2)})`
    : ''

  return (
    <div
      onClick={() => onTap(listing)}
      className="bg-[#2C2A45] rounded-3xl overflow-hidden shadow-xl shadow-[#2C2A45]/30 cursor-pointer hover:scale-[1.01] transition-all duration-300 flex flex-col sm:flex-row border border-white/10 group"
    >
      {/* ── Image (~42% width on desktop) ── */}
      <div className="w-full sm:w-[42%] sm:min-w-[220px] aspect-[16/10] sm:aspect-auto relative overflow-hidden bg-white/5 flex items-center justify-center">
        {firstImage ? (
          <img
            src={firstImage}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="text-4xl text-white/30">📦</span>
        )}
      </div>

      {/* ── Content ── */}
      <div className="p-5 sm:p-6 flex flex-col justify-center flex-1 space-y-2.5">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF7A4D]">
          FEATURED
        </p>

        <h3 className="text-lg sm:text-xl font-extrabold text-white line-clamp-2 leading-tight group-hover:text-[#9C7FF2] transition-colors">
          {listing.title}
        </h3>

        <div>
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${conditionBadge.bg} ${conditionBadge.text}`}
          >
            {conditionBadge.label}
          </span>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <span
            className="px-3.5 py-1 rounded-full text-sm font-black text-white shadow-md"
            style={{ background: MarketplaceTheme.heroGradient }}
          >
            ₹{Math.round(listing.price).toLocaleString('en-IN')}
          </span>

          {listing.profiles?.full_name && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8D8AA0] truncate max-w-[200px]">
              <User size={13} className="shrink-0 text-[#8D8AA0]" />
              <span className="truncate text-white/80">
                {listing.profiles.full_name}
                {sellerYear}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
