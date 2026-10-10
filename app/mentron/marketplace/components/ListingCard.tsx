'use client'

import { User } from 'lucide-react'
import { MarketplaceListing } from '../types'
import { MarketplaceTheme, getConditionBadgeStyles } from '../theme'

interface Props {
  listing: MarketplaceListing
  onTap: (listing: MarketplaceListing) => void
}

export function ListingCard({ listing, onTap }: Props) {
  const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : null
  const conditionBadge = getConditionBadgeStyles(listing.condition)

  const sellerYear = listing.profiles?.admission_year
    ? ` ('${listing.profiles.admission_year.toString().slice(-2)})`
    : ''

  return (
    <div
      onClick={() => onTap(listing)}
      className="bg-white rounded-[20px] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer border border-black/[0.04] group"
    >
      {/* ── Image ── */}
      <div className="aspect-[1.1] relative overflow-hidden bg-[#EDEAFF] flex items-center justify-center">
        {firstImage ? (
          <img
            src={firstImage}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="text-3xl text-[#7B6EF6]/40">📦</span>
        )}
      </div>

      {/* ── Info ── */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1">
        {/* Condition badge */}
        <div>
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${conditionBadge.bg} ${conditionBadge.text}`}
          >
            {conditionBadge.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-2 text-sm sm:text-base font-extrabold text-[#2C2A45] line-clamp-2 leading-snug group-hover:text-[#7B6EF6] transition-colors">
          {listing.title}
        </h3>

        {/* Seller */}
        {listing.profiles?.full_name && (
          <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-[#8D8AA0] truncate">
            <User size={12} className="shrink-0 text-[#8D8AA0]" />
            <span className="truncate">
              {listing.profiles.full_name}
              {sellerYear}
            </span>
          </div>
        )}

        {/* Price Pill */}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span
            className="px-3 py-1 rounded-full text-xs sm:text-sm font-black text-white shadow-sm"
            style={{ background: MarketplaceTheme.heroGradient }}
          >
            ₹{Math.round(listing.price).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  )
}
