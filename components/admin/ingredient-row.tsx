'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Trash2, Minus, Plus, Check, X } from 'lucide-react'
import type { Ingredient } from '@/lib/types'

interface IngredientRowProps {
  ingredient: Ingredient
  onEdit: (ingredient: Ingredient) => void
  onDelete: (id: string) => void
  onStockAdjust: (ingredient: Ingredient, delta: number) => void
}

export function IngredientRow({ ingredient, onEdit, onDelete, onStockAdjust }: IngredientRowProps) {
  const [stockInput, setStockInput] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const isLowStock =
    ingredient.low_stock_threshold > 0 &&
    ingredient.stock_quantity <= ingredient.low_stock_threshold

  function handleStockClick() {
    setStockInput(String(ingredient.stock_quantity))
  }

  function handleStockConfirm() {
    if (stockInput === null) return
    const newQty = Number(stockInput)
    if (!isNaN(newQty) && newQty >= 0) {
      const delta = newQty - ingredient.stock_quantity
      onStockAdjust(ingredient, delta)
    }
    setStockInput(null)
  }

  function handleStockCancel() {
    setStockInput(null)
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${ingredient.name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/ingredients/${ingredient.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) {
        onDelete(ingredient.id)
      } else {
        alert(json.error ?? 'Failed to delete ingredient')
      }
    } catch {
      alert('Failed to delete ingredient')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={[
      'flex flex-col sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1.5fr_auto] sm:gap-4 items-start sm:items-center px-4 py-3 bg-white border-b border-warm-100 last:border-b-0 hover:bg-warm-50 transition-colors',
      isLowStock ? 'border-l-2 border-l-orange-400' : '',
    ].join(' ')}>
      {/* Name + unit badge */}
      <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
        <span className="text-sm font-medium text-warm-700 truncate">{ingredient.name}</span>
        <span className="text-xs text-warm-400 bg-warm-100 px-1.5 py-0.5 rounded shrink-0">
          {ingredient.unit}
        </span>
      </div>

      {/* Cost per unit */}
      <div className="flex items-center gap-2 mt-1 sm:mt-0">
        <span className="text-xs text-warm-400 sm:hidden">Cost:</span>
        <span className="font-mono text-sm text-warm-600">
          ${ingredient.cost_per_unit.toFixed(2)}
        </span>
      </div>

      {/* Stock (inline editable) */}
      <div className="flex items-center gap-1 mt-1 sm:mt-0">
        <span className="text-xs text-warm-400 sm:hidden">Stock:</span>
        {stockInput !== null ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={stockInput}
              onChange={(e) => setStockInput(e.target.value)}
              className="w-20 h-7 text-xs font-mono"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleStockConfirm()
                if (e.key === 'Escape') handleStockCancel()
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 text-green-600 hover:text-green-700"
              onClick={handleStockConfirm}
            >
              <Check className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 text-warm-400 hover:text-warm-600"
              onClick={handleStockCancel}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onStockAdjust(ingredient, -1)}
              className="w-8 h-8 flex items-center justify-center text-warm-400 hover:text-warm-600 rounded min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:w-5 sm:h-5"
              title="Remove 1"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={handleStockClick}
              className={[
                'font-mono text-sm px-1 rounded hover:bg-warm-100 transition-colors min-h-[44px] sm:min-h-0',
                isLowStock ? 'text-orange-600 font-semibold' : 'text-warm-600',
              ].join(' ')}
              title="Click to set exact amount"
            >
              {ingredient.stock_quantity}
            </button>
            <button
              onClick={() => onStockAdjust(ingredient, 1)}
              className="w-8 h-8 flex items-center justify-center text-warm-400 hover:text-warm-600 rounded min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:w-5 sm:h-5"
              title="Add 1"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Threshold */}
      <div className="flex items-center gap-2 mt-1 sm:mt-0">
        <span className="text-xs text-warm-400 sm:hidden">Alert at:</span>
        <span className="font-mono text-sm text-warm-400">
          {ingredient.low_stock_threshold > 0 ? ingredient.low_stock_threshold : '—'}
        </span>
      </div>

      {/* Supplier */}
      <div className="flex items-center mt-1 sm:mt-0 min-w-0">
        <span className="text-xs text-warm-400 sm:hidden mr-2">Supplier:</span>
        <span className="text-sm text-warm-500 truncate">
          {ingredient.supplier ?? <span className="text-warm-300">—</span>}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 mt-2 sm:mt-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(ingredient)}
          className="w-8 h-8 text-warm-400 hover:text-warm-700"
          aria-label={`Edit ${ingredient.name}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleting}
          className="w-8 h-8 text-warm-400 hover:text-red-500"
          aria-label={`Delete ${ingredient.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
