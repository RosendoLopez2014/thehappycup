'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// Using native <select> for ingredient dropdown — shadcn Select shows UUIDs instead of names
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Plus, Trash2, ChefHat } from 'lucide-react'
import type { Ingredient, MenuItem, RecipeWithIngredients } from '@/lib/types'

const SIZE_VARIANTS = ['small', 'medium', 'large'] as const
type SizeVariant = (typeof SIZE_VARIANTS)[number]

interface RecipeIngredientRow {
  ingredient_id: string
  quantity: string
  notes: string
}

interface RecipeBuilderProps {
  menuItem: MenuItem
  onClose: () => void
}

function emptyRows(): RecipeIngredientRow[] {
  return []
}

function recipeToRows(recipe: RecipeWithIngredients | undefined): RecipeIngredientRow[] {
  if (!recipe) return emptyRows()
  return recipe.recipe_ingredients.map((ri) => ({
    ingredient_id: ri.ingredient_id,
    quantity: String(ri.quantity),
    notes: ri.notes ?? '',
  }))
}

function calcCost(rows: RecipeIngredientRow[], ingredients: Ingredient[]): number {
  return rows.reduce((sum, row) => {
    const ing = ingredients.find((i) => i.id === row.ingredient_id)
    if (!ing) return sum
    return sum + ing.cost_per_unit * (Number(row.quantity) || 0)
  }, 0)
}

export function RecipeBuilder({ menuItem, onClose }: RecipeBuilderProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Per-size rows state
  const [rowsBySize, setRowsBySize] = useState<Record<SizeVariant, RecipeIngredientRow[]>>({
    small: [],
    medium: [],
    large: [],
  })

  const [saving, setSaving] = useState<SizeVariant | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedSize, setSavedSize] = useState<SizeVariant | null>(null)

  const fetchData = useCallback(async () => {
    setLoadingData(true)
    try {
      const [ingRes, recRes] = await Promise.all([
        fetch('/api/admin/ingredients'),
        fetch(`/api/admin/recipes?menu_item_id=${menuItem.id}`),
      ])
      const [ingJson, recJson] = await Promise.all([ingRes.json(), recRes.json()])

      const fetchedIngredients: Ingredient[] = ingJson.data ?? []
      const fetchedRecipes: RecipeWithIngredients[] = recJson.data ?? []

      setIngredients(fetchedIngredients)
      setRecipes(fetchedRecipes)

      // Populate rows from existing recipes
      const initial: Record<SizeVariant, RecipeIngredientRow[]> = {
        small: [],
        medium: [],
        large: [],
      }
      for (const size of SIZE_VARIANTS) {
        const recipe = fetchedRecipes.find((r) => r.size_variant === size)
        initial[size] = recipeToRows(recipe)
      }
      setRowsBySize(initial)
    } catch (err) {
      console.error('RecipeBuilder fetch error:', err)
    } finally {
      setLoadingData(false)
    }
  }, [menuItem.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function addRow(size: SizeVariant) {
    setRowsBySize((prev) => ({
      ...prev,
      [size]: [...prev[size], { ingredient_id: '', quantity: '1', notes: '' }],
    }))
  }

  function removeRow(size: SizeVariant, idx: number) {
    setRowsBySize((prev) => ({
      ...prev,
      [size]: prev[size].filter((_, i) => i !== idx),
    }))
  }

  function updateRow(
    size: SizeVariant,
    idx: number,
    field: keyof RecipeIngredientRow,
    value: string
  ) {
    setRowsBySize((prev) => ({
      ...prev,
      [size]: prev[size].map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    }))
  }

  async function handleSave(size: SizeVariant) {
    setSaving(size)
    setSaveError(null)
    setSavedSize(null)

    const rows = rowsBySize[size].filter((r) => r.ingredient_id)

    try {
      const res = await fetch('/api/admin/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_item_id: menuItem.id,
          size_variant: size,
          ingredients: rows.map((r) => ({
            ingredient_id: r.ingredient_id,
            quantity: Number(r.quantity) || 0,
            notes: r.notes || undefined,
          })),
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setSaveError(json.error ?? 'Failed to save recipe')
        return
      }

      // Update local recipes state
      setRecipes((prev) => {
        const filtered = prev.filter((r) => r.size_variant !== size)
        return [...filtered, json.data]
      })

      setSavedSize(size)
      setTimeout(() => setSavedSize(null), 2000)
    } catch (err) {
      console.error('RecipeBuilder save error:', err)
      setSaveError('An unexpected error occurred')
    } finally {
      setSaving(null)
    }
  }

  async function handleDeleteRecipe(size: SizeVariant) {
    const recipe = recipes.find((r) => r.size_variant === size)
    if (!recipe) {
      // Just clear rows locally
      setRowsBySize((prev) => ({ ...prev, [size]: [] }))
      return
    }

    if (!window.confirm(`Delete the ${size} recipe for "${menuItem.name}"?`)) return

    try {
      const res = await fetch(`/api/admin/recipes/${recipe.id}`, { method: 'DELETE' })
      if (res.ok) {
        setRecipes((prev) => prev.filter((r) => r.size_variant !== size))
        setRowsBySize((prev) => ({ ...prev, [size]: [] }))
      }
    } catch (err) {
      console.error('RecipeBuilder delete error:', err)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-warm-400" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {ingredients.length === 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          No ingredients found. Add ingredients on the{' '}
          <a href="/admin/ingredients" className="underline font-medium">
            Ingredients page
          </a>{' '}
          first.
        </div>
      )}

      <Tabs defaultValue="small">
        <TabsList className="w-full">
          {SIZE_VARIANTS.map((size) => {
            const hasRecipe = recipes.some((r) => r.size_variant === size)
            return (
              <TabsTrigger key={size} value={size} className="flex-1 capitalize">
                {size}
                {hasRecipe && (
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {SIZE_VARIANTS.map((size) => {
          const rows = rowsBySize[size]
          const cost = calcCost(rows, ingredients)
          const sellPrice = menuItem.price
          const profit = sellPrice - cost
          const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0
          const hasRecipe = recipes.some((r) => r.size_variant === size)

          return (
            <TabsContent key={size} value={size} className="mt-4 flex flex-col gap-4">
              {/* Ingredient rows */}
              <div className="flex flex-col gap-2">
                {rows.length === 0 && (
                  <p className="text-sm text-warm-400 text-center py-4">
                    No ingredients yet. Add one below.
                  </p>
                )}

                {rows.map((row, idx) => {
                  const ing = ingredients.find((i) => i.id === row.ingredient_id)
                  return (
                    <div key={idx} className="flex flex-col gap-2 p-3 rounded-lg bg-warm-50/50">
                      {/* Row 1: Ingredient selector — full width, always visible */}
                      <div className="flex items-center gap-2">
                        <select
                          value={row.ingredient_id}
                          onChange={(e) => updateRow(size, idx, 'ingredient_id', e.target.value)}
                          className="flex-1 rounded-lg border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-700 focus:outline-none focus:ring-2 focus:ring-warm-500 min-h-[44px]"
                        >
                          <option value="">Select ingredient...</option>
                          {ingredients.map((ingredient) => (
                            <option key={ingredient.id} value={ingredient.id}>
                              {ingredient.name} ({ingredient.unit})
                            </option>
                          ))}
                        </select>
                        {/* Remove */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(size, idx)}
                          className="w-10 h-10 text-warm-300 hover:text-red-500 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Row 2: Quantity, unit, cost */}
                      <div className="flex items-center gap-3 pl-1">
                        <div className="w-20 shrink-0">
                          <Input
                            type="number"
                            min="0"
                            step="0.001"
                            value={row.quantity}
                            onChange={(e) => updateRow(size, idx, 'quantity', e.target.value)}
                            placeholder="qty"
                            className="text-sm font-mono text-center"
                          />
                        </div>
                        <span className="text-sm text-warm-400">
                          {ing?.unit ?? ''}
                        </span>
                        <span className="text-sm font-mono text-warm-500 font-medium">
                          @ ${ing?.cost_per_unit?.toFixed(2) ?? '0.00'}/{ing?.unit ?? ''}
                        </span>
                        <span className="ml-auto text-sm font-mono text-warm-700 font-semibold">
                          = ${ing
                            ? (ing.cost_per_unit * (Number(row.quantity) || 0)).toFixed(2)
                            : '0.00'}
                        </span>
                      </div>
                    </div>
                  )
                })}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addRow(size)}
                  className="self-start text-warm-500 h-7 px-2"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add ingredient
                </Button>
              </div>

              {/* Cost / margin summary */}
              {rows.length > 0 && (
                <div className="rounded-lg bg-warm-50 border border-warm-200 px-4 py-3 grid grid-cols-3 gap-4 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-warm-400">Cost</span>
                    <span className="font-mono font-semibold text-warm-700">
                      ${cost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-warm-400">Sell price</span>
                    <span className="font-mono font-semibold text-warm-700">
                      ${sellPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-warm-400">Profit / Margin</span>
                    <span
                      className={[
                        'font-mono font-semibold',
                        profit >= 0 ? 'text-green-600' : 'text-red-500',
                      ].join(' ')}
                    >
                      ${profit.toFixed(2)} ({margin.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              )}

              {/* Error */}
              {saveError && (
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{saveError}</p>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                {hasRecipe && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRecipe(size)}
                    className="text-warm-400 hover:text-red-500 text-xs min-h-[44px] sm:min-h-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete {size} recipe
                  </Button>
                )}
                <div className="sm:ml-auto flex items-center gap-2">
                  {savedSize === size && (
                    <span className="text-xs text-green-600 font-medium">Saved!</span>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleSave(size)}
                    disabled={saving === size}
                    className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0"
                  >
                    {saving === size ? (
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <ChefHat className="w-4 h-4 mr-1.5" />
                    )}
                    Save {size} recipe
                  </Button>
                </div>
              </div>
            </TabsContent>
          )
        })}
      </Tabs>

      <div className="flex justify-end pt-2 border-t border-warm-100">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}

// Cost summary badge for menu list — shows cost/margin when recipe exists
interface RecipeCostBadgeProps {
  menuItemId: string
  sellPrice: number
}

export function RecipeCostBadge({ menuItemId, sellPrice }: RecipeCostBadgeProps) {
  const [data, setData] = useState<{ cost: number; hasRecipe: boolean } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/admin/recipes?menu_item_id=${menuItemId}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return
        const recipes: RecipeWithIngredients[] = json.data ?? []
        if (recipes.length === 0) {
          setData({ cost: 0, hasRecipe: false })
          return
        }
        // Average cost across sizes that have recipes
        const totalCost = recipes.reduce((sum, recipe) => {
          const c = recipe.recipe_ingredients.reduce(
            (s, ri) => s + (ri.ingredients?.cost_per_unit ?? 0) * ri.quantity,
            0
          )
          return sum + c
        }, 0)
        const avgCost = totalCost / recipes.length
        setData({ cost: avgCost, hasRecipe: true })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [menuItemId])

  if (!data) return null

  if (!data.hasRecipe) {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-warm-100 text-warm-400 font-medium">
        No recipe
      </span>
    )
  }

  const profit = sellPrice - data.cost
  const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0

  return (
    <span className="text-[10px] font-mono text-warm-500 shrink-0">
      ${data.cost.toFixed(2)} cost · {margin.toFixed(0)}% margin
    </span>
  )
}
