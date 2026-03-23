'use client'

import type { MenuCategory } from '@/lib/types'

interface MenuFiltersProps {
  categories: MenuCategory[]
  onFilterChange: (categoryId: string | null) => void
  selectedCategoryId: string | null
}

export function MenuFilters({
  categories,
  onFilterChange,
  selectedCategoryId,
}: MenuFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
      <button
        onClick={() => onFilterChange(null)}
        className={`shrink-0 snap-start px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
          selectedCategoryId === null
            ? 'bg-warm-600 text-white'
            : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onFilterChange(category.id)}
          className={`shrink-0 snap-start px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
            selectedCategoryId === category.id
              ? 'bg-warm-600 text-white'
              : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}
