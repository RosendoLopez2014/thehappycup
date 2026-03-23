'use client'

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import type { MenuItem, ItemOption, CartItem } from '@/lib/types'
import { useCart } from '@/components/cart-provider'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MinusIcon, PlusIcon } from 'lucide-react'

interface ItemCustomizationModalProps {
  item: (MenuItem & { item_options: ItemOption[] }) | null
  open: boolean
  onClose: () => void
}

function groupOptions(options: ItemOption[]): Map<string, ItemOption[]> {
  const groups = new Map<string, ItemOption[]>()
  for (const option of options) {
    const group = option.option_group
    if (!groups.has(group)) {
      groups.set(group, [])
    }
    groups.get(group)!.push(option)
  }
  return groups
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

export function ItemCustomizationModal({
  item,
  open,
  onClose,
}: ItemCustomizationModalProps) {
  const { addItem } = useCart()

  const optionGroups = useMemo(
    () => (item ? groupOptions(item.item_options) : new Map<string, ItemOption[]>()),
    [item]
  )

  // Build initial selection: first option in each group
  const buildInitialSelections = (
    groups: Map<string, ItemOption[]>
  ): Record<string, ItemOption> => {
    const selections: Record<string, ItemOption> = {}
    for (const [group, options] of groups) {
      if (options.length > 0) {
        const sorted = [...options].sort((a, b) => a.display_order - b.display_order)
        selections[group] = sorted[0]
      }
    }
    return selections
  }

  const [selectedOptions, setSelectedOptions] = useState<Record<string, ItemOption>>(
    () => buildInitialSelections(optionGroups)
  )
  const [quantity, setQuantity] = useState(1)

  // Reset state whenever the modal opens with a new item
  useEffect(() => {
    if (open && item) {
      const groups = groupOptions(item.item_options)
      setSelectedOptions(buildInitialSelections(groups))
      setQuantity(1)
    }
  }, [open, item])

  const optionAdjustments = useMemo(() => {
    return Object.values(selectedOptions).reduce(
      (sum, opt) => sum + opt.price_adjustment,
      0
    )
  }, [selectedOptions])

  const unitPrice = (item?.price ?? 0) + optionAdjustments
  const totalPrice = unitPrice * quantity

  function handleSelectOption(group: string, option: ItemOption) {
    setSelectedOptions((prev) => ({ ...prev, [group]: option }))
  }

  function handleDecrement() {
    setQuantity((q) => Math.max(1, q - 1))
  }

  function handleIncrement() {
    setQuantity((q) => Math.min(10, q + 1))
  }

  function handleAddToCart() {
    if (!item) return

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
    toast.success('Added to cart!')
    onClose()
  }

  if (!item) return null

  const sortedGroups = Array.from(optionGroups.entries()).map(([group, options]) => ({
    group,
    options: [...options].sort((a, b) => a.display_order - b.display_order),
  }))

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="max-w-sm sm:max-w-md p-0 overflow-hidden rounded-2xl">
        {/* Image / placeholder */}
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-warm-100 to-warm-200">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 448px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-6xl select-none">☕</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 p-5">
          <DialogHeader>
            <DialogTitle className="text-warm-600 text-lg font-semibold">
              {item.name}
            </DialogTitle>
            {item.description && (
              <DialogDescription className="text-warm-400 text-sm leading-relaxed">
                {item.description}
              </DialogDescription>
            )}
          </DialogHeader>

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
                      const isSelected =
                        selectedOptions[group]?.id === option.id
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleSelectOption(group, option)}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-500 ${
                            isSelected
                              ? 'border-warm-600 bg-warm-600 text-white'
                              : 'border-warm-200 bg-white text-warm-500 hover:border-warm-400 hover:text-warm-600'
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

          {/* Price display */}
          <div className="flex items-center justify-between rounded-xl bg-warm-50 px-4 py-3">
            <span className="text-sm font-medium text-warm-500">Unit price</span>
            <span className="font-mono text-base font-semibold text-warm-600">
              {formatPrice(unitPrice)}
            </span>
          </div>

          {/* Quantity selector */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-warm-500">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDecrement}
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
                onClick={handleIncrement}
                disabled={quantity >= 10}
                aria-label="Increase quantity"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-warm-200 text-warm-500 transition-colors hover:border-warm-400 hover:text-warm-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PlusIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Add to cart */}
          <Button
            onClick={handleAddToCart}
            className="w-full rounded-xl bg-warm-600 py-3 text-sm font-semibold text-white hover:bg-warm-700"
          >
            Add to Cart — {formatPrice(totalPrice)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
