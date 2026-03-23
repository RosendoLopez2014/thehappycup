import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/admin/menu — list all items with categories and options
export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      *,
      menu_categories ( id, name, display_order ),
      item_options ( * )
    `)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Failed to fetch menu items:', error)
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
  }

  // Sort item_options by display_order within each item
  const items = (data ?? []).map((item) => ({
    ...item,
    item_options: (item.item_options ?? []).sort(
      (a: { display_order: number }, b: { display_order: number }) =>
        a.display_order - b.display_order
    ),
  }))

  // Sort by category display_order then item display_order
  items.sort((a, b) => {
    const catA = (a.menu_categories as { display_order: number } | null)?.display_order ?? 0
    const catB = (b.menu_categories as { display_order: number } | null)?.display_order ?? 0
    if (catA !== catB) return catA - catB
    return a.display_order - b.display_order
  })

  return NextResponse.json({ data: items })
}

interface CreateMenuItemBody {
  name: string
  description?: string
  price: number
  categoryId: string
  imageUrl?: string
  options?: { group: string; name: string; priceAdjustment: number }[]
}

// POST /api/admin/menu — create a new menu item with options
export async function POST(request: Request) {
  let body: CreateMenuItemBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, description, price, categoryId, imageUrl, options } = body

  if (!name || price == null || !categoryId) {
    return NextResponse.json(
      { error: 'name, price, and categoryId are required' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Get the max display_order for this category
  const { data: existing } = await supabase
    .from('menu_items')
    .select('display_order')
    .eq('category_id', categoryId)
    .order('display_order', { ascending: false })
    .limit(1)
    .single()

  const nextDisplayOrder = existing ? (existing.display_order ?? 0) + 1 : 0

  const { data: item, error: itemError } = await supabase
    .from('menu_items')
    .insert({
      name,
      description: description ?? null,
      price,
      category_id: categoryId,
      image_url: imageUrl ?? null,
      is_available: true,
      display_order: nextDisplayOrder,
    })
    .select()
    .single()

  if (itemError || !item) {
    console.error('Failed to create menu item:', itemError)
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
  }

  // Insert options if provided
  if (options && options.length > 0) {
    const optionRows = options.map((opt, idx) => ({
      item_id: item.id,
      option_group: opt.group,
      option_name: opt.name,
      price_adjustment: opt.priceAdjustment,
      display_order: idx,
    }))

    const { error: optError } = await supabase.from('item_options').insert(optionRows)

    if (optError) {
      console.error('Failed to insert item options:', optError)
      // Item was created — return partial success with warning
      return NextResponse.json(
        { data: item, warning: 'Item created but options failed to save' },
        { status: 201 }
      )
    }
  }

  return NextResponse.json({ data: item }, { status: 201 })
}
