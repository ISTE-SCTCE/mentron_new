'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { MarketplaceListing, ListingCategory } from './types'
import { MarketplaceTheme } from './theme'
import { MarketplaceGradientHeader } from './components/MarketplaceGradientHeader'
import { CategoryChipBar } from './components/CategoryChipBar'
import { FeaturedListingCard } from './components/FeaturedListingCard'
import { ListingCard } from './components/ListingCard'
import { ListingDetailModal } from './components/ListingDetailModal'
import { DisclaimerConsentModal } from './components/DisclaimerConsentModal'
import { deleteMarketplaceListing } from './actions'

interface Props {
  initialListings: MarketplaceListing[]
  currentUserId?: string
  currentUserRole?: string
}

export function MarketplaceClient({
  initialListings,
  currentUserId,
  currentUserRole,
}: Props) {
  const [listings, setListings] = useState<MarketplaceListing[]>(initialListings)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | null>(null)

  const [activeDetailListing, setActiveDetailListing] = useState<MarketplaceListing | null>(null)
  const [activeBuyListing, setActiveBuyListing] = useState<MarketplaceListing | null>(null)

  // Filter listings by category and search query matching Flutter logic
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      if (selectedCategory && item.category !== selectedCategory) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const titleMatch = item.title?.toLowerCase().includes(q)
        const descMatch = item.description?.toLowerCase().includes(q)
        const sellerMatch = item.profiles?.full_name?.toLowerCase().includes(q)
        return titleMatch || descMatch || sellerMatch
      }
      return true
    })
  }, [listings, selectedCategory, searchQuery])

  // Featured listing is the first one in the list (matching Flutter logic)
  const featured = filteredListings.length > 0 ? filteredListings[0] : null
  const restListings = filteredListings.length > 1 ? filteredListings.slice(1) : []

  const handleDelete = async (listingId: string) => {
    await deleteMarketplaceListing(listingId)
    setListings((prev) => prev.filter((item) => item.id !== listingId))
    if (activeDetailListing?.id === listingId) {
      setActiveDetailListing(null)
    }
  }

  return (
    <div className="min-h-screen pb-24 bg-[#F6F4FC] text-[#2C2A45] -mt-16 sm:-mt-20">
      {/* ── Gradient hero banner ── */}
      <MarketplaceGradientHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-8 mt-6 sm:mt-8 space-y-6 sm:space-y-8">
        {/* ── Category chips bar ── */}
        <CategoryChipBar
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* ── Section Heading ── */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-xl sm:text-2xl font-black text-[#2C2A45] tracking-tight">
            Fresh Listings
          </h2>
          <span className="text-xs font-bold text-[#8D8AA0] uppercase tracking-wider">
            {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* ── Content: Empty State or Grid ── */}
        {filteredListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl shadow-[#7B6EF6]/20"
              style={{ background: MarketplaceTheme.heroGradient }}
            >
              <ShoppingBag size={36} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-[#2C2A45]">No listings yet</h3>
              <p className="text-sm font-medium text-[#8D8AA0]">
                {searchQuery || selectedCategory
                  ? 'Try changing your search keywords or category filters.'
                  : 'Be the first to list something!'}
              </p>
            </div>
            <Link
              href="/marketplace/new"
              className="px-6 py-3 rounded-full font-black text-white text-sm shadow-md hover:scale-105 transition-all inline-flex items-center"
              style={{ background: MarketplaceTheme.heroGradient }}
            >
              Sell Something
            </Link>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* ── Featured Card (Bento Hero) ── */}
            {featured && (
              <FeaturedListingCard
                listing={featured}
                onTap={setActiveDetailListing}
              />
            )}

            {/* ── 2-Column to 4-Column Responsive Grid ── */}
            {restListings.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
                {restListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onTap={setActiveDetailListing}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Detail Bottom Sheet / Modal ── */}
      <ListingDetailModal
        listing={activeDetailListing}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onClose={() => setActiveDetailListing(null)}
        onBuy={(listing) => {
          setActiveDetailListing(null)
          setActiveBuyListing(listing)
        }}
        onDelete={handleDelete}
      />

      {/* ── Buy / Consent Flow Modal ── */}
      <DisclaimerConsentModal
        listing={activeBuyListing}
        currentUserId={currentUserId}
        onClose={() => setActiveBuyListing(null)}
        onSuccess={() => {
          setActiveBuyListing(null)
        }}
      />
    </div>
  )
}
