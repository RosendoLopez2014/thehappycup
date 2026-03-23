'use client'

import { useState } from 'react'
import type { MenuItem, MenuCategory, ItemOption } from '@/lib/types'
import { MenuFilters } from '@/components/menu-filters'
import { MenuItemCard } from '@/components/menu-item-card'

interface MenuGridProps {
  items: (MenuItem & { item_options: ItemOption[] })[]
  categories: MenuCategory[]
  storeOpen: boolean
}

export function MenuGrid({ items, categories, storeOpen }: MenuGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredItems =
    selectedCategory === null
      ? items
      : items.filter((item) => item.category_id === selectedCategory)

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <MenuFilters
        categories={categories}
        onFilterChange={setSelectedCategory}
        selectedCategoryId={selectedCategory}
      />

      {filteredItems.length === 0 ? (
        <p className="text-center text-warm-400 text-sm py-12">
          No items available in this category.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              disabled={!storeOpen}
              onClick={undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
