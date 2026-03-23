'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { MenuItem, MenuCategory, ItemOption } from '@/lib/types'
import { MenuFilters } from '@/components/menu-filters'
import { MenuItemCard } from '@/components/menu-item-card'
import { useCart } from '@/components/cart-provider'

interface MenuGridProps {
  items: (MenuItem & { item_options: ItemOption[] })[]
  categories: MenuCategory[]
  storeOpen: boolean
}

export function MenuGrid({ items, categories, storeOpen }: MenuGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const { itemCount, subtotal } = useCart()

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

  const formatPrice = (price: number) => `$${price.toFixed(2)}`

  return (
    <div className={`flex flex-col gap-4 px-4 py-4 ${itemCount > 0 ? 'pb-28 sm:pb-4' : ''}`}>
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredItems.map((item) => {
            const isExpanded = expandedItemId === item.id
            const isDimmed = expandedItemId !== null && !isExpanded

            return (
              <MenuItemCard
                key={item.id}
                item={item}
                disabled={false}
                expanded={isExpanded}
                onExpand={() => handleExpand(item.id)}
                onCollapse={handleCollapse}
                dimmed={isDimmed}
              />
            )
          })}
        </div>
      )}

      {/* Sticky cart bar — mobile only, shown when cart has items */}
      {itemCount > 0 && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 px-4 safe-bottom">
          <Link
            href="/cart"
            className="flex items-center justify-between w-full bg-warm-600 text-white rounded-2xl px-5 py-4 shadow-lg mb-2 min-h-[56px]"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span className="bg-white text-warm-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold leading-none">
                {itemCount}
              </span>
              View Cart
            </span>
            <span className="text-sm font-semibold">{formatPrice(subtotal)}</span>
          </Link>
        </div>
      )}
    </div>
  )
}
