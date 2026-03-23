'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle, Plus } from 'lucide-react'
import type { Ingredient } from '@/lib/types'
import { IngredientForm } from '@/components/admin/ingredient-form'
import { IngredientRow } from '@/components/admin/ingredient-row'

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)

  const fetchIngredients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ingredients')
      const json = await res.json()
      if (res.ok) setIngredients(json.data ?? [])
    } catch (err) {
      console.error('Failed to fetch ingredients:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIngredients()
  }, [fetchIngredients])

  function handleEdit(ingredient: Ingredient) {
    setEditingIngredient(ingredient)
    setDialogOpen(true)
  }

  function handleOpenNew() {
    setEditingIngredient(null)
    setDialogOpen(true)
  }

  function handleSaved(updated: Ingredient) {
    setIngredients((prev) => {
      const idx = prev.findIndex((i) => i.id === updated.id)
      if (idx !== -1) {
        return prev.map((i) => (i.id === updated.id ? updated : i))
      }
      return [...prev, updated].sort((a, b) => a.name.localeCompare(b.name))
    })
    setDialogOpen(false)
    setEditingIngredient(null)
  }

  function handleDeleted(id: string) {
    setIngredients((prev) => prev.filter((i) => i.id !== id))
  }

  async function handleStockAdjust(ingredient: Ingredient, delta: number) {
    const newQty = Math.max(0, ingredient.stock_quantity + delta)
    const optimistic = ingredients.map((i) =>
      i.id === ingredient.id ? { ...i, stock_quantity: newQty } : i
    )
    setIngredients(optimistic)

    try {
      const res = await fetch(`/api/admin/ingredients/${ingredient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_quantity: newQty }),
      })
      if (!res.ok) {
        // revert
        setIngredients(ingredients)
      }
    } catch {
      setIngredients(ingredients)
    }
  }

  const lowStock = ingredients.filter(
    (i) => i.low_stock_threshold > 0 && i.stock_quantity <= i.low_stock_threshold
  )

  const totalInventoryValue = ingredients.reduce(
    (sum, i) => sum + i.cost_per_unit * i.stock_quantity,
    0
  )

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl font-semibold text-warm-600">Ingredients</h1>
        <Button size="sm" onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Ingredient
        </Button>
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
            <h2 className="text-sm font-semibold text-orange-700">
              Low Stock Alert ({lowStock.length})
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((i) => (
              <span
                key={i.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
              >
                {i.name}
                <span className="font-mono">
                  {i.stock_quantity} {i.unit}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="rounded-xl border border-warm-200 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-white border-b border-warm-100 animate-pulse" />
          ))}
        </div>
      ) : ingredients.length === 0 ? (
        <div className="text-center py-16 text-warm-400">
          <p className="text-sm font-medium">No ingredients yet</p>
          <p className="text-xs mt-1">Click &ldquo;Add Ingredient&rdquo; to get started</p>
        </div>
      ) : (
        <div className="rounded-xl border border-warm-200 overflow-hidden overflow-x-auto">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_auto] gap-4 px-4 py-2.5 bg-warm-50 border-b border-warm-200 text-xs font-semibold text-warm-500 uppercase tracking-wider">
            <span>Name</span>
            <span>Cost / Unit</span>
            <span>Stock</span>
            <span>Threshold</span>
            <span>Supplier</span>
            <span />
          </div>

          {ingredients.map((ingredient) => (
            <IngredientRow
              key={ingredient.id}
              ingredient={ingredient}
              onEdit={handleEdit}
              onDelete={handleDeleted}
              onStockAdjust={handleStockAdjust}
            />
          ))}
        </div>
      )}

      {/* Cost summary */}
      {ingredients.length > 0 && (
        <div className="mt-4 flex justify-end">
          <div className="rounded-lg bg-warm-50 border border-warm-200 px-4 py-2.5 text-sm">
            <span className="text-warm-500">Total inventory value: </span>
            <span className="font-mono font-semibold text-warm-700">
              ${totalInventoryValue.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false)
            setEditingIngredient(null)
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIngredient ? `Edit "${editingIngredient.name}"` : 'New Ingredient'}
            </DialogTitle>
          </DialogHeader>
          <IngredientForm
            ingredient={editingIngredient ?? undefined}
            onSave={handleSaved}
            onCancel={() => {
              setDialogOpen(false)
              setEditingIngredient(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
