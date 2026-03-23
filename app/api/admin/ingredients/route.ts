import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// GET /api/admin/ingredients — list all ingredients ordered by name
export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Failed to fetch ingredients:', error)
    return NextResponse.json({ error: 'Failed to fetch ingredients' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

interface CreateIngredientBody {
  name: string
  unit: string
  cost_per_unit: number
  stock_quantity?: number
  low_stock_threshold?: number
  supplier?: string
}

// POST /api/admin/ingredients — create ingredient
export async function POST(request: Request) {
  let body: CreateIngredientBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, unit, cost_per_unit, stock_quantity, low_stock_threshold, supplier } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  if (!unit?.trim()) {
    return NextResponse.json({ error: 'unit is required' }, { status: 400 })
  }
  if (cost_per_unit == null || isNaN(Number(cost_per_unit))) {
    return NextResponse.json({ error: 'valid cost_per_unit is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('ingredients')
    .insert({
      name: name.trim(),
      unit: unit.trim(),
      cost_per_unit: Number(cost_per_unit),
      stock_quantity: Number(stock_quantity ?? 0),
      low_stock_threshold: Number(low_stock_threshold ?? 0),
      supplier: supplier?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create ingredient:', error)
    return NextResponse.json({ error: 'Failed to create ingredient' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

interface PatchIngredientBody {
  name?: string
  unit?: string
  cost_per_unit?: number
  stock_quantity?: number
  low_stock_threshold?: number
  supplier?: string | null
}

// PATCH /api/admin/ingredients — bulk update (e.g. stock adjustment)
export async function PATCH(request: Request) {
  let body: PatchIngredientBody & { id: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('ingredients')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update ingredient:', error)
    return NextResponse.json({ error: 'Failed to update ingredient' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
