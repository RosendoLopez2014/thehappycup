'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import type { Ingredient } from '@/lib/types'

const UNITS = ['can', 'pump', 'oz', 'scoop', 'piece', 'cup', 'packet', 'ml', 'g', 'other'] as const

interface IngredientFormProps {
  ingredient?: Ingredient
  onSave: (ingredient: Ingredient) => void
  onCancel: () => void
}

export function IngredientForm({ ingredient, onSave, onCancel }: IngredientFormProps) {
  const isEdit = Boolean(ingredient)

  const [name, setName] = useState(ingredient?.name ?? '')
  const [unit, setUnit] = useState(ingredient?.unit ?? '')
  const [costPerUnit, setCostPerUnit] = useState(
    ingredient ? String(ingredient.cost_per_unit) : ''
  )
  const [stockQuantity, setStockQuantity] = useState(
    ingredient ? String(ingredient.stock_quantity) : '0'
  )
  const [lowStockThreshold, setLowStockThreshold] = useState(
    ingredient ? String(ingredient.low_stock_threshold) : '0'
  )
  const [supplier, setSupplier] = useState(ingredient?.supplier ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) { setError('Name is required'); return }
    if (!unit.trim()) { setError('Unit is required'); return }
    if (!costPerUnit || isNaN(Number(costPerUnit))) {
      setError('Valid cost per unit is required')
      return
    }

    setLoading(true)

    const payload = {
      name: name.trim(),
      unit: unit.trim(),
      cost_per_unit: Number(costPerUnit),
      stock_quantity: Number(stockQuantity) || 0,
      low_stock_threshold: Number(lowStockThreshold) || 0,
      supplier: supplier.trim() || null,
    }

    try {
      const url = isEdit ? `/api/admin/ingredients/${ingredient!.id}` : '/api/admin/ingredients'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Failed to save ingredient')
        setLoading(false)
        return
      }

      onSave(json.data)
    } catch (err) {
      console.error('IngredientForm error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ing-name">Name</Label>
        <Input
          id="ing-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Red Bull, Oat Milk"
          disabled={loading}
          required
        />
      </div>

      {/* Unit */}
      <div className="flex flex-col gap-1.5">
        <Label>Unit</Label>
        <Select value={unit} onValueChange={(v) => setUnit(v ?? '')} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="Select unit" />
          </SelectTrigger>
          <SelectContent>
            {UNITS.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cost per unit */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ing-cost">Cost per unit ($)</Label>
        <Input
          id="ing-cost"
          type="number"
          min="0"
          step="0.01"
          value={costPerUnit}
          onChange={(e) => setCostPerUnit(e.target.value)}
          placeholder="0.00"
          disabled={loading}
          required
        />
      </div>

      {/* Stock & Threshold */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ing-stock">Current stock</Label>
          <Input
            id="ing-stock"
            type="number"
            min="0"
            step="0.01"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            placeholder="0"
            disabled={loading}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ing-threshold">Low stock alert at</Label>
          <Input
            id="ing-threshold"
            type="number"
            min="0"
            step="0.01"
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(e.target.value)}
            placeholder="0"
            disabled={loading}
          />
        </div>
      </div>

      {/* Supplier */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ing-supplier">Supplier (optional)</Label>
        <Input
          id="ing-supplier"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="e.g. Costco, Restaurant Depot"
          disabled={loading}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="min-h-[44px]">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="min-h-[44px]">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEdit ? 'Save changes' : 'Add ingredient'}
        </Button>
      </div>
    </form>
  )
}
