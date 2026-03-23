import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface PatchBody {
  name?: string
  unit?: string
  cost_per_unit?: number
  stock_quantity?: number
  low_stock_threshold?: number
  supplier?: string | null
}

// PATCH /api/admin/ingredients/[id] — update single ingredient
export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params

  let body: PatchBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('ingredients')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update ingredient:', error)
    return NextResponse.json({ error: 'Failed to update ingredient' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// DELETE /api/admin/ingredients/[id] — delete ingredient if not used in recipes
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = createAdminClient()

  // Check if ingredient is referenced by any recipe_ingredients
  const { count, error: countError } = await supabase
    .from('recipe_ingredients')
    .select('*', { count: 'exact', head: true })
    .eq('ingredient_id', id)

  if (countError) {
    console.error('Failed to check ingredient usage:', countError)
    return NextResponse.json({ error: 'Failed to check ingredient usage' }, { status: 500 })
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Cannot delete ingredient that is used in one or more recipes' },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from('ingredients')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete ingredient:', error)
    return NextResponse.json({ error: 'Failed to delete ingredient' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
