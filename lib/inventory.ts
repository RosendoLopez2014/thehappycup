import { createAdminClient } from '@/lib/supabase/admin'

// Maps display size names (from selected_options) to size_variant values in recipes
function normalizeSize(sizeOptionName: string): string | null {
  const lower = sizeOptionName.toLowerCase()
  if (lower.startsWith('small')) return 'small'
  if (lower.startsWith('medium')) return 'medium'
  if (lower.startsWith('large')) return 'large'
  return null
}

interface DeductedEntry {
  ingredientId: string
  ingredientName: string
  amountDeducted: number
  newStock: number
}

interface LowStockEntry {
  ingredientId: string
  ingredientName: string
  stock: number
  threshold: number
}

export interface DeductInventoryResult {
  deducted: DeductedEntry[]
  lowStock: LowStockEntry[]
  errors: string[]
}

/**
 * Deducts inventory for all items in an order.
 * Looks up recipes by menu_item_id + size_variant, falls back to base recipe
 * (no size_variant) if a size-specific recipe doesn't exist.
 * Aggregates deductions per ingredient across all order items, then applies
 * them in batch. Writes an inventory_log entry for each deduction.
 */
export async function deductInventoryForOrder(orderId: string): Promise<DeductInventoryResult> {
  const supabase = createAdminClient()
  const errors: string[] = []

  // 1. Fetch order items with selected_options
  const { data: orderItems, error: orderItemsError } = await supabase
    .from('order_items')
    .select('id, menu_item_id, quantity, selected_options')
    .eq('order_id', orderId)

  if (orderItemsError) {
    return {
      deducted: [],
      lowStock: [],
      errors: [`Failed to fetch order items: ${orderItemsError.message}`],
    }
  }

  if (!orderItems || orderItems.length === 0) {
    return { deducted: [], lowStock: [], errors: [] }
  }

  // 2. For each order item, find the correct recipe and accumulate deductions
  // Map: ingredientId -> total quantity to deduct
  const deductionMap = new Map<string, number>()

  for (const item of orderItems) {
    const opts = item.selected_options as Record<string, { name: string; priceAdjustment: number }>
    const sizeOpt = opts?.size ?? opts?.Size ?? null
    const sizeVariant = sizeOpt ? normalizeSize(sizeOpt.name) : null

    // Try size-specific recipe first, then fall back to base recipe (null size_variant)
    let recipe: { id: string; recipe_ingredients: { ingredient_id: string; quantity: number }[] } | null = null

    if (sizeVariant) {
      const { data: sizeRecipe } = await supabase
        .from('recipes')
        .select('id, recipe_ingredients(ingredient_id, quantity)')
        .eq('menu_item_id', item.menu_item_id)
        .eq('size_variant', sizeVariant)
        .maybeSingle()

      recipe = sizeRecipe
    }

    // Fall back to base recipe (no size_variant)
    if (!recipe) {
      const { data: baseRecipe } = await supabase
        .from('recipes')
        .select('id, recipe_ingredients(ingredient_id, quantity)')
        .eq('menu_item_id', item.menu_item_id)
        .is('size_variant', null)
        .maybeSingle()

      recipe = baseRecipe
    }

    if (!recipe) {
      // No recipe found — not an error, item just has no tracked ingredients
      continue
    }

    const recipeIngredients = recipe.recipe_ingredients as { ingredient_id: string; quantity: number }[]
    for (const ri of recipeIngredients) {
      const total = ri.quantity * item.quantity
      deductionMap.set(ri.ingredient_id, (deductionMap.get(ri.ingredient_id) ?? 0) + total)
    }
  }

  if (deductionMap.size === 0) {
    return { deducted: [], lowStock: [], errors: [] }
  }

  // 3. Fetch current stock for all affected ingredients
  const ingredientIds = Array.from(deductionMap.keys())
  const { data: ingredients, error: ingError } = await supabase
    .from('ingredients')
    .select('id, name, unit, stock_quantity, low_stock_threshold')
    .in('id', ingredientIds)

  if (ingError) {
    return {
      deducted: [],
      lowStock: [],
      errors: [`Failed to fetch ingredients: ${ingError.message}`],
    }
  }

  // 4. Apply deductions
  const deducted: DeductedEntry[] = []
  const lowStock: LowStockEntry[] = []
  const logEntries: {
    ingredient_id: string
    order_id: string
    quantity_change: number
    reason: string
  }[] = []

  for (const ing of ingredients ?? []) {
    const amount = deductionMap.get(ing.id) ?? 0
    const newStock = Math.max(0, ing.stock_quantity - amount)

    const { error: updateError } = await supabase
      .from('ingredients')
      .update({ stock_quantity: newStock })
      .eq('id', ing.id)

    if (updateError) {
      errors.push(`Failed to update stock for "${ing.name}": ${updateError.message}`)
      continue
    }

    deducted.push({
      ingredientId: ing.id,
      ingredientName: ing.name,
      amountDeducted: amount,
      newStock,
    })

    logEntries.push({
      ingredient_id: ing.id,
      order_id: orderId,
      quantity_change: -amount,
      reason: `Order deduction (order ${orderId})`,
    })

    if (ing.low_stock_threshold > 0 && newStock <= ing.low_stock_threshold) {
      lowStock.push({
        ingredientId: ing.id,
        ingredientName: ing.name,
        stock: newStock,
        threshold: ing.low_stock_threshold,
      })
    }
  }

  // 5. Write log entries (best-effort; don't fail status update on log errors)
  if (logEntries.length > 0) {
    const { error: logError } = await supabase.from('inventory_log').insert(logEntries)
    if (logError) {
      errors.push(`Failed to write inventory log: ${logError.message}`)
    }
  }

  return { deducted, lowStock, errors }
}
