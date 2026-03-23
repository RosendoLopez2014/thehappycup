'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { MinusIcon, PlusIcon, XIcon } from 'lucide-react'
import type { MenuItem, ItemOption, CartItem } from '@/lib/types'
import { useCart } from '@/components/cart-provider'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface MenuItemCardProps {
  item: MenuItem & { item_options?: ItemOption[] }
  disabled?: boolean
  expanded: boolean
  onExpand: () => void
  onCollapse: () => void
  dimmed: boolean
}

function groupOptions(options: ItemOption[]): Map<string, ItemOption[]> {
  const groups = new Map<string, ItemOption[]>()
  for (const option of options) {
    const group = option.option_group
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)!.push(option)
  }
  return groups
}

function buildInitialSelections(groups: Map<string, ItemOption[]>): Record<string, ItemOption> {
  const selections: Record<string, ItemOption> = {}
  for (const [group, options] of groups) {
    if (options.length > 0) {
      const sorted = [...options].sort((a, b) => a.display_order - b.display_order)
      selections[group] = sorted[0]
    }
  }
  return selections
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

export function MenuItemCard({
  item,
  disabled = false,
  expanded,
  onExpand,
  onCollapse,
  dimmed,
}: MenuItemCardProps) {
  const { addItem } = useCart()
  const cardRef = useRef<HTMLDivElement>(null)

  const itemOptions = item.item_options ?? []
  const optionGroups = useMemo(() => groupOptions(itemOptions), [itemOptions])

  const [selectedOptions, setSelectedOptions] = useState<Record<string, ItemOption>>(
    () => buildInitialSelections(optionGroups)
  )
  const [quantity, setQuantity] = useState(1)

  // Reset state when expanded
  useEffect(() => {
    if (expanded) {
      setSelectedOptions(buildInitialSelections(optionGroups))
      setQuantity(1)
    }
  }, [expanded, optionGroups])

  const optionAdjustments = useMemo(
    () => Object.values(selectedOptions).reduce((sum, opt) => sum + opt.price_adjustment, 0),
    [selectedOptions]
  )

  const unitPrice = item.price + optionAdjustments
  const totalPrice = unitPrice * quantity

  const sortedGroups = useMemo(
    () =>
      Array.from(optionGroups.entries()).map(([group, options]) => ({
        group,
        options: [...options].sort((a, b) => a.display_order - b.display_order),
      })),
    [optionGroups]
  )

  function handleSelectOption(group: string, option: ItemOption) {
    setSelectedOptions((prev) => ({ ...prev, [group]: option }))
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation()

    const cartSelectedOptions: CartItem['selectedOptions'] = {}
    for (const [group, option] of Object.entries(selectedOptions)) {
      cartSelectedOptions[group] = {
        name: option.option_name,
        priceAdjustment: option.price_adjustment,
      }
    }

    const cartItem: CartItem = {
      menuItemId: item.id,
      name: item.name,
      price: unitPrice,
      quantity,
      selectedOptions: cartSelectedOptions,
      lineTotal: totalPrice,
      imageUrl: item.image_url,
    }

    addItem(cartItem)
    toast.success(`${item.name} added to cart!`)
    onCollapse()
  }

  function handleCardClick() {
    if (disabled) return
    if (expanded) {
      onCollapse()
    } else {
      onExpand()
    }
  }

  function handleCollapseButton(e: React.MouseEvent) {
    e.stopPropagation()
    onCollapse()
  }

  return (
    <Card
      ref={cardRef}
      className={`rounded-2xl bg-white border-warm-200 overflow-hidden transition-all duration-300 ${
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : dimmed
            ? 'opacity-50 cursor-pointer'
            : 'cursor-pointer'
      } ${expanded ? 'shadow-lg col-span-full sm:col-span-full lg:col-span-full' : 'hover:shadow-md'}`}
      onClick={handleCardClick}
    >
      {/* Image area */}
      <div className={`relative w-full overflow-hidden transition-all duration-300 ${expanded ? 'h-48' : 'h-40'}`}>
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-warm-100 to-warm-200 flex items-center justify-center">
            <span className="text-4xl select-none">☕</span>
          </div>
        )}
        {expanded && (
          <button
            type="button"
            onClick={handleCollapseButton}
            aria-label="Close"
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-warm-600 text-sm leading-snug line-clamp-1">
            {item.name}
          </h3>
          <span className="font-mono text-sm font-medium text-warm-500 shrink-0">
            {formatPrice(expanded ? unitPrice : item.price)}
          </span>
        </div>

        {item.description && (
          <p className={`text-xs text-warm-400 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {item.description}
          </p>
        )}

        {/* Collapsed state: simple button */}
        {!expanded && (
          <Button
            size="sm"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation()
              if (!disabled) handleCardClick()
            }}
            className="mt-1 w-full bg-warm-600 hover:bg-warm-700 text-white text-xs rounded-xl"
          >
            {disabled
              ? 'Closed'
              : itemOptions.length > 0
                ? 'Customize'
                : 'Add'}
          </Button>
        )}

        {/* Expanded state: full customization UI */}
        {expanded && (
          <div
            className="flex flex-col gap-4 mt-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Option groups */}
            {sortedGroups.length > 0 && (
              <div className="flex flex-col gap-4">
                {sortedGroups.map(({ group, options }) => (
                  <div key={group} className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-warm-500">
                      {capitalize(group)}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {options.map((option) => {
                        const isSelected = selectedOptions[group]?.id === option.id
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectOption(group, option)
                            }}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-500 ${
                              isSelected
                                ? 'border-warm-600 bg-warm-600 text-white'
                                : 'border-warm-200 bg-warm-100 text-warm-500 hover:border-warm-400 hover:text-warm-600'
                            }`}
                          >
                            {option.option_name}
                            {option.price_adjustment > 0 && (
                              <span className="ml-1 opacity-80">
                                +{formatPrice(option.price_adjustment)}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity selector */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-warm-500">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setQuantity((q) => Math.max(1, q - 1))
                  }}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-warm-200 text-warm-500 transition-colors hover:border-warm-400 hover:text-warm-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <MinusIcon className="h-3.5 w-3.5" />
                </button>
                <span className="w-4 text-center font-mono text-sm font-semibold text-warm-600">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setQuantity((q) => Math.min(10, q + 1))
                  }}
                  disabled={quantity >= 10}
                  aria-label="Increase quantity"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-warm-200 text-warm-500 transition-colors hover:border-warm-400 hover:text-warm-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              className="w-full rounded-xl bg-warm-600 py-3 text-sm font-semibold text-white hover:bg-warm-700"
            >
              Add to Cart — {formatPrice(totalPrice)}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
