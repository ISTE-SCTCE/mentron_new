export type ListingCategory =
  | 'textbook'
  | 'electronics'
  | 'project_components'
  | 'stationery'
  | 'other'

export type ListingCondition = 'new' | 'like_new' | 'used'

export type ListingStatus = 'pending_review' | 'live' | 'sold' | 'removed'

export interface MarketplaceListing {
  id: string
  seller_id: string
  title: string
  description: string
  category: ListingCategory
  condition: ListingCondition
  price: number
  images: string[]
  status: ListingStatus
  created_at: string
  profiles?: {
    full_name?: string | null
    department?: string | null
    admission_year?: number | null
  } | null
}
