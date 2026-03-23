'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { MinusIcon, PlusIcon, ChevronDown } from 'lucide-react'
import type { MenuItem, ItemOption, CartItem } from '@/lib/types'
import { useCart } from '@/components/cart-provider'
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
  const expandedRef = useRef<HTMLDivElement>(null)

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

  // Scroll expanded card into view on mobile
  useEffect(() => {
    if (expanded && expandedRef.current) {
      setTimeout(() => {
        expandedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    }
  }, [expanded])

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

  const hasOptions = itemOptions.length > 0

  return (
    <div
      className={`transition-all duration-300 ease-in-out ${
        dimmed ? 'opacity-40 scale-[0.98]' : ''
      }`}
    >
      {/* Main card — always visible */}
      <div
        onClick={handleCardClick}
        className={`relative rounded-2xl bg-white border overflow-hidden cursor-pointer transition-all duration-300 ${
          expanded
            ? 'border-warm-600 shadow-lg ring-1 ring-warm-600/20'
            : 'border-warm-200 hover:shadow-md hover:border-warm-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {/* Image */}
        <div className="relative w-full h-40 overflow-hidden">
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
        </div>

        {/* Card body */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-warm-700 text-sm leading-snug line-clamp-1">
              {item.name}
            </h3>
            <span className="font-mono text-sm font-semibold text-warm-600 shrink-0">
              {formatPrice(expanded ? unitPrice : item.price)}
            </span>
          </div>

          {item.description && (
            <p className="text-xs text-warm-400 leading-relaxed mt-1 line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Collapsed: Happy Foam hint + tap to customize */}
          {!expanded && (
            <>
              {hasOptions && itemOptions.some(o => o.option_group === 'happy_foam') && (
                <div className="mt-2 flex items-center gap-1 text-warm-500">
                  <span className="text-[11px]">✨</span>
                  <span className="text-[11px] font-medium">+ Happy Foam™</span>
                </div>
              )}
              <div className="mt-2 flex items-center justify-center gap-1.5 text-warm-400">
                <span className="text-xs font-medium">
                  {hasOptions ? 'Tap to customize' : 'Tap to add'}
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Expanded options panel — slides down below the card */}
      <div
        ref={expandedRef}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'max-h-[600px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'
        }`}
      >
        <div
          className="rounded-2xl bg-white border border-warm-200 p-4 shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Option groups */}
          {sortedGroups.length > 0 && (
            <div className="flex flex-col gap-3">
              {sortedGroups
                .filter(({ group }) => group !== 'happy_foam')
                .map(({ group, options }) => (
                <div key={group}>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-warm-400 mb-2 block">
                    {capitalize(group)}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {options.map((option) => {
                      const isSelected = selectedOptions[group]?.id === option.id
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleSelectOption(group, option)}
                          className={`rounded-full px-3 py-2 text-xs font-medium transition-all duration-200 min-h-[44px] ${
                            isSelected
                              ? 'bg-warm-600 text-white shadow-sm'
                              : 'bg-warm-50 text-warm-500 hover:bg-warm-100 hover:text-warm-600'
                          }`}
                        >
                          {option.option_name}
                          {option.price_adjustment > 0 && (
                            <span className="ml-1 opacity-75">
                              +{formatPrice(option.price_adjustment)}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Happy Foam™ — special styled section */}
              {sortedGroups.some(({ group }) => group === 'happy_foam') && (() => {
                const foamGroup = sortedGroups.find(({ group }) => group === 'happy_foam')!
                const foamOptions = foamGroup.options
                const selectedFoam = selectedOptions['happy_foam']
                const hasFoam = selectedFoam && selectedFoam.option_name !== 'No Foam'
                return (
                  <div className={`rounded-xl border p-3 transition-all duration-200 ${
                    hasFoam
                      ? 'border-warm-600/30 bg-warm-600/5'
                      : 'border-warm-200 bg-warm-50/50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-warm-500">
                        ✨ Make it Happy
                      </span>
                      {hasFoam && (
                        <span className="text-[10px] font-medium text-warm-600 bg-warm-200/60 px-2 py-0.5 rounded-full">
                          +{formatPrice(selectedFoam.price_adjustment)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {foamOptions.map((option) => {
                        const isSelected = selectedOptions['happy_foam']?.id === option.id
                        const isFoamOption = option.option_name !== 'No Foam'
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSelectOption('happy_foam', option)}
                            className={`rounded-full px-3 py-2 text-xs font-medium transition-all duration-200 min-h-[44px] ${
                              isSelected && isFoamOption
                                ? 'bg-warm-600 text-white shadow-sm'
                                : isSelected
                                  ? 'bg-white text-warm-500 border border-warm-300'
                                  : 'bg-white text-warm-400 hover:text-warm-500 border border-warm-200'
                            }`}
                          >
                            {isFoamOption ? `+ ${option.option_name}` : option.option_name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Quantity + Add to Cart row */}
          <div className="flex items-center gap-3 mt-4">
            {/* Quantity */}
            <div className="flex items-center gap-2 bg-warm-50 rounded-full px-1 py-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className="flex h-9 w-9 items-center justify-center rounded-full text-warm-500 transition-colors hover:bg-warm-100 disabled:opacity-30"
              >
                <MinusIcon className="h-3.5 w-3.5" />
              </button>
              <span className="w-5 text-center font-mono text-sm font-bold text-warm-700">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                disabled={quantity >= 10}
                aria-label="Increase quantity"
                className="flex h-9 w-9 items-center justify-center rounded-full text-warm-500 transition-colors hover:bg-warm-100 disabled:opacity-30"
              >
                <PlusIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              className="flex-1 rounded-full bg-warm-600 py-2.5 text-sm font-semibold text-white hover:bg-warm-700 transition-colors"
            >
              Add to Cart — {formatPrice(totalPrice)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
