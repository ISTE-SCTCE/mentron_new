'use client'

import { ListingCategory } from '../types'
import { MarketplaceTheme } from '../theme'

interface Props {
  selected: ListingCategory | null
  onSelect: (cat: ListingCategory | null) => void
}

const CATEGORIES: { key: ListingCategory | null; label: string }[] = [
  { key: null, label: 'All' },
  { key: 'textbook', label: 'Textbooks' },
  { key: 'electronics', label: 'Electronics' },
  { key: 'project_components', label: 'Project Parts' },
  { key: 'stationery', label: 'Stationery' },
  { key: 'other', label: 'Other' },
]

export function CategoryChipBar({ selected, onSelect }: Props) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 px-4 sm:px-8">
      <div className="flex items-center gap-2.5 max-w-6xl mx-auto">
        {CATEGORIES.map(({ key, label }) => {
          const isSelected = selected === key

          return (
            <button
              key={label}
              onClick={() => onSelect(key)}
              type="button"
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'text-white shadow-md shadow-[#7B6EF6]/30 scale-[1.02]'
                  : 'bg-white text-[#8D8AA0] hover:text-[#2C2A45] hover:bg-white/90 shadow-sm border border-black/5'
              }`}
              style={{
                background: isSelected ? MarketplaceTheme.heroGradient : undefined,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
