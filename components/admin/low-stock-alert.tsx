'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import type { Ingredient } from '@/lib/types'

export function LowStockAlert() {
  const [lowStockItems, setLowStockItems] = useState<Ingredient[]>([])
  const [dismissed, setDismissed] = useState(false)

  const fetchLowStock = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ingredients')
      if (!res.ok) return
      const json = await res.json()
      const all: Ingredient[] = json.data ?? []
      const low = all.filter(
        (i) => i.low_stock_threshold > 0 && i.stock_quantity <= i.low_stock_threshold
      )
      setLowStockItems(low)
    } catch {
      // Silently ignore — this is a non-critical UI enhancement
    }
  }, [])

  useEffect(() => {
    fetchLowStock()
  }, [fetchLowStock])

  if (dismissed || lowStockItems.length === 0) return null

  const isCritical = lowStockItems.some((i) => i.stock_quantity === 0)

  return (
    <div
      className={[
        'flex items-start gap-3 px-4 py-3 text-sm',
        isCritical
          ? 'bg-red-50 border-b border-red-200 text-red-800'
          : 'bg-orange-50 border-b border-orange-200 text-orange-800',
      ].join(' ')}
    >
      <AlertTriangle
        className={[
          'w-4 h-4 mt-0.5 shrink-0',
          isCritical ? 'text-red-500' : 'text-orange-500',
        ].join(' ')}
      />

      <div className="flex-1 min-w-0">
        <span className="font-semibold">
          {isCritical ? 'Critical stock: ' : 'Low stock: '}
        </span>
        <span>
          {lowStockItems.map((i) => (
            <span key={i.id} className="inline-flex items-center gap-1 mr-2">
              <span className="font-medium">{i.name}</span>
              <span className="font-mono text-xs opacity-75">
                ({i.stock_quantity} {i.unit})
              </span>
            </span>
          ))}
        </span>
        <a
          href="/admin/ingredients"
          className={[
            'underline font-medium ml-1 whitespace-nowrap',
            isCritical ? 'text-red-700 hover:text-red-900' : 'text-orange-700 hover:text-orange-900',
          ].join(' ')}
        >
          Restock →
        </a>
      </div>

      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss low stock alert"
        className={[
          'shrink-0 rounded p-0.5 hover:bg-black/10 transition-colors',
          isCritical ? 'text-red-500' : 'text-orange-500',
        ].join(' ')}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
