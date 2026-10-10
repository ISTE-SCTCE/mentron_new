'use client'

import { useState } from 'react'
import { X, Trash2, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { MarketplaceListing } from '../types'
import { MarketplaceTheme, getCategoryLabel, getConditionBadgeStyles } from '../theme'

interface Props {
  listing: MarketplaceListing | null
  currentUserId?: string
  currentUserRole?: string
  onClose: () => void
  onBuy: (listing: MarketplaceListing) => void
  onDelete?: (listingId: string) => Promise<void>
}

export function ListingDetailModal({
  listing,
  currentUserId,
  currentUserRole,
  onClose,
  onBuy,
  onDelete,
}: Props) {
  const [imageIndex, setImageIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!listing) return null

  const images = listing.images && listing.images.length > 0 ? listing.images : []
  const conditionBadge = getConditionBadgeStyles(listing.condition)
  const categoryLabel = getCategoryLabel(listing.category)

  const isSeller = currentUserId && listing.seller_id === currentUserId
  const isExec = currentUserRole === 'exec' || currentUserRole === 'core' || currentUserRole === 'admin'
  const canDelete = isSeller || isExec

  const sellerYear = listing.profiles?.admission_year
    ? `'${listing.profiles.admission_year.toString().slice(-2)}`
    : ''

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing? This cannot be undone.')) return
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(listing.id)
      onClose()
    } catch (e: any) {
      alert(`Failed to delete: ${e?.message || e}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden relative animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Drag Handle (mobile) ── */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#DDDAF0]" />
        </div>

        {/* ── Close Button ── */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors shadow-md"
        >
          <X size={18} />
        </button>

        {/* ── Scrollable Body ── */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {/* ── Image Carousel ── */}
          <div
            className="w-full h-64 sm:h-72 relative flex items-center justify-center overflow-hidden shrink-0"
            style={{ background: MarketplaceTheme.heroGradient }}
          >
            {images.length > 0 ? (
              <img
                src={images[imageIndex]}
                alt={listing.title}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="text-white/40 text-6xl">📦</div>
            )}

            {/* Prev / Next controls */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="absolute left-2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  className="absolute right-2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Dot indicators */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {images.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        imageIndex === i ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Details Content ── */}
          <div className="p-5 sm:p-6 space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${conditionBadge.bg} ${conditionBadge.text}`}
              >
                {conditionBadge.label}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EDEAFF] text-[#7B6EF6]">
                {categoryLabel}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-black text-[#2C2A45] leading-snug">
              {listing.title}
            </h2>

            {/* Price */}
            <p className="text-xl font-black text-[#7B6EF6]">
              ₹{Math.round(listing.price).toLocaleString('en-IN')}
            </p>

            {/* Description */}
            {listing.description && (
              <div className="space-y-1.5 pt-2">
                <p className="text-xs font-bold text-[#8D8AA0] uppercase tracking-wider">
                  About this item
                </p>
                <p className="text-sm text-[#2C2A45]/80 leading-relaxed whitespace-pre-line font-medium">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Seller Card */}
            <div className="p-3.5 rounded-2xl bg-[#F6F4FC] flex items-center gap-3 border border-black/[0.04]">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm"
                style={{ background: MarketplaceTheme.heroGradient }}
              >
                <User size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#2C2A45] truncate">
                  {listing.profiles?.full_name || 'Anonymous Student'}
                </p>
                <p className="text-xs text-[#8D8AA0] font-medium truncate">
                  {[listing.profiles?.department, sellerYear].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>

            {/* Delete button (Seller or Admin) */}
            {canDelete && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 size={15} />
                {isDeleting ? 'Deleting...' : 'Delete Listing'}
              </button>
            )}
          </div>
        </div>

        {/* ── Sticky Bottom Bar matching Flutter ── */}
        <div className="p-4 sm:p-5 border-t border-black/[0.06] bg-white flex items-center gap-3 shrink-0">
          {/* Price Pill */}
          <div className="px-4 py-2.5 rounded-full bg-[#EDEAFF] text-[#7B6EF6] font-black text-base shrink-0">
            ₹{Math.round(listing.price).toLocaleString('en-IN')}
          </div>

          {/* Buy Now Button */}
          <button
            type="button"
            onClick={() => onBuy(listing)}
            className="flex-1 h-12 rounded-full font-black text-white text-base shadow-lg shadow-[#7B6EF6]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
            style={{ background: MarketplaceTheme.heroGradient }}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  )
}
