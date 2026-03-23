import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// GET /api/admin/recipes — list recipes with ingredients
// Query params: menu_item_id, item_option_id
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const menuItemId = searchParams.get('menu_item_id')
  const itemOptionId = searchParams.get('item_option_id')

  const supabase = createAdminClient()

  let query = supabase
    .from('recipes')
    .select(`
      *,
      recipe_ingredients (
        *,
        ingredients ( * )
      )
    `)
    .order('size_variant', { ascending: true })

  if (menuItemId) {
    query = query.eq('menu_item_id', menuItemId)
  } else if (itemOptionId) {
    query = query.eq('item_option_id', itemOptionId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch recipes:', error)
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

interface RecipeIngredientInput {
  ingredient_id: string
  quantity: number
  notes?: string
}

interface UpsertRecipeBody {
  menu_item_id?: string
  item_option_id?: string
  size_variant?: string | null
  ingredients: RecipeIngredientInput[]
}

// POST /api/admin/recipes — upsert recipe (replace if exists for item+size)
export async function POST(request: Request) {
  let body: UpsertRecipeBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { menu_item_id, item_option_id, size_variant, ingredients } = body

  if (!menu_item_id && !item_option_id) {
    return NextResponse.json(
      { error: 'Either menu_item_id or item_option_id is required' },
      { status: 400 }
    )
  }

  if (!Array.isArray(ingredients)) {
    return NextResponse.json({ error: 'ingredients must be an array' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Find existing recipe for this item + size
  let existingQuery = supabase
    .from('recipes')
    .select('id')

  if (menu_item_id) {
    existingQuery = existingQuery.eq('menu_item_id', menu_item_id)
  } else {
    existingQuery = existingQuery.eq('item_option_id', item_option_id!)
  }

  if (size_variant) {
    existingQuery = existingQuery.eq('size_variant', size_variant)
  } else {
    existingQuery = existingQuery.is('size_variant', null)
  }

  const { data: existingRecipe } = await existingQuery.maybeSingle()

  let recipeId: string

  if (existingRecipe) {
    // Delete existing recipe_ingredients (cascade will handle if we delete the recipe,
    // but let's keep the recipe row and just replace ingredients)
    const { error: delError } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', existingRecipe.id)

    if (delError) {
      console.error('Failed to clear recipe ingredients:', delError)
      return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 })
    }

    recipeId = existingRecipe.id
  } else {
    // Create new recipe
    const insertPayload: Record<string, unknown> = {
      size_variant: size_variant ?? null,
    }
    if (menu_item_id) insertPayload.menu_item_id = menu_item_id
    if (item_option_id) insertPayload.item_option_id = item_option_id

    const { data: newRecipe, error: recipeError } = await supabase
      .from('recipes')
      .insert(insertPayload)
      .select('id')
      .single()

    if (recipeError || !newRecipe) {
      console.error('Failed to create recipe:', recipeError)
      return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 })
    }

    recipeId = newRecipe.id
  }

  // Insert ingredients if any provided
  if (ingredients.length > 0) {
    const rows = ingredients.map((ing) => ({
      recipe_id: recipeId,
      ingredient_id: ing.ingredient_id,
      quantity: Number(ing.quantity),
      notes: ing.notes ?? null,
    }))

    const { error: ingError } = await supabase
      .from('recipe_ingredients')
      .insert(rows)

    if (ingError) {
      console.error('Failed to insert recipe ingredients:', ingError)
      return NextResponse.json({ error: 'Failed to save recipe ingredients' }, { status: 500 })
    }
  }

  // Return the full recipe with ingredients
  const { data: fullRecipe, error: fetchError } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_ingredients (
        *,
        ingredients ( * )
      )
    `)
    .eq('id', recipeId)
    .single()

  if (fetchError) {
    console.error('Failed to fetch saved recipe:', fetchError)
    return NextResponse.json({ error: 'Recipe saved but failed to fetch result' }, { status: 500 })
  }

  return NextResponse.json({ data: fullRecipe }, { status: 201 })
}
