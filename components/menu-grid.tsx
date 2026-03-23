'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
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
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const filteredItems =
    selectedCategory === null
      ? items
      : items.filter((item) => item.category_id === selectedCategory)

  const handleExpand = useCallback((id: string) => {
    setExpandedItemId(id)
  }, [])

  const handleCollapse = useCallback(() => {
    setExpandedItemId(null)
  }, [])

  // Collapse when clicking outside the grid
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        expandedItemId &&
        gridRef.current &&
        !gridRef.current.contains(e.target as Node)
      ) {
        setExpandedItemId(null)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [expandedItemId])

  // Collapse on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && expandedItemId) {
        setExpandedItemId(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [expandedItemId])

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <MenuFilters
        categories={categories}
        onFilterChange={(id) => {
          setSelectedCategory(id)
          setExpandedItemId(null)
        }}
        selectedCategoryId={selectedCategory}
      />

      {filteredItems.length === 0 ? (
        <p className="text-center text-warm-400 text-sm py-12">
          No items available in this category.
        </p>
      ) : (
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredItems.map((item) => {
            const isExpanded = expandedItemId === item.id
            const isDimmed = expandedItemId !== null && !isExpanded

            return (
              <MenuItemCard
                key={item.id}
                item={item}
                disabled={!storeOpen}
                expanded={isExpanded}
                onExpand={() => handleExpand(item.id)}
                onCollapse={handleCollapse}
                dimmed={isDimmed}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
