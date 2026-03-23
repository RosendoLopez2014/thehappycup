'use client'

import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/cart-provider'
import type { CartItem } from '@/lib/types'

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

function formatSelectedOptions(
  selectedOptions: CartItem['selectedOptions']
): string {
  const entries = Object.values(selectedOptions)
  if (entries.length === 0) return ''
  return entries.map((opt) => opt.name).join(', ')
}

export function CartSummary() {
  const { items, removeItem, updateQuantity } = useCart()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-warm-400 text-lg">Your cart is empty</p>
        <Link href="/">
          <Button className="bg-warm-600 hover:bg-warm-700 text-white rounded-xl">
            Browse Menu
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const optionsLabel = formatSelectedOptions(item.selectedOptions)
        return (
          <div
            key={`${item.menuItemId}-${JSON.stringify(item.selectedOptions)}`}
            className="flex items-start gap-4 bg-white rounded-2xl border border-warm-200 p-4"
          >
            {/* Item details */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-warm-600 text-sm leading-snug">
                {item.name}
              </p>
              {optionsLabel && (
                <p className="text-xs text-warm-400 mt-0.5">{optionsLabel}</p>
              )}

              {/* Quantity controls */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  aria-label="Decrease quantity"
                  onClick={() =>
                    updateQuantity(
                      item.menuItemId,
                      item.selectedOptions,
                      item.quantity - 1
                    )
                  }
                  className="w-9 h-9 rounded-full border border-warm-200 flex items-center justify-center text-warm-600 hover:bg-warm-100 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-5 text-center text-sm font-medium text-warm-600">
                  {item.quantity}
                </span>
                <button
                  aria-label="Increase quantity"
                  onClick={() =>
                    updateQuantity(
                      item.menuItemId,
                      item.selectedOptions,
                      item.quantity + 1
                    )
                  }
                  className="w-9 h-9 rounded-full border border-warm-200 flex items-center justify-center text-warm-600 hover:bg-warm-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Line total + remove */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="font-mono text-sm font-medium text-warm-600">
                {formatPrice(item.lineTotal)}
              </span>
              <button
                aria-label={`Remove ${item.name} from cart`}
                onClick={() => removeItem(item.menuItemId, item.selectedOptions)}
                className="text-warm-300 hover:text-red-500 transition-colors w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
