import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface PatchMenuItemBody {
  name?: string
  description?: string
  price?: number
  categoryId?: string
  imageUrl?: string | null
  is_available?: boolean
  display_order?: number
  options?: { group: string; name: string; priceAdjustment: number }[]
}

// PATCH /api/admin/menu/[id] — update item fields and/or options and/or availability
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let body: PatchMenuItemBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Build the update object for menu_items
  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.description !== undefined) updates.description = body.description
  if (body.price !== undefined) updates.price = body.price
  if (body.categoryId !== undefined) updates.category_id = body.categoryId
  if (body.imageUrl !== undefined) updates.image_url = body.imageUrl
  if (body.is_available !== undefined) updates.is_available = body.is_available
  if (body.display_order !== undefined) updates.display_order = body.display_order

  let item = null

  if (Object.keys(updates).length > 0) {
    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update menu item:', error)
      return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 })
    }
    item = data
  }

  // Replace options if provided
  if (body.options !== undefined) {
    const { error: deleteError } = await supabase
      .from('item_options')
      .delete()
      .eq('item_id', id)

    if (deleteError) {
      console.error('Failed to delete old options:', deleteError)
      return NextResponse.json({ error: 'Failed to update options' }, { status: 500 })
    }

    if (body.options.length > 0) {
      const optionRows = body.options.map((opt, idx) => ({
        item_id: id,
        option_group: opt.group,
        option_name: opt.name,
        price_adjustment: opt.priceAdjustment,
        display_order: idx,
      }))

      const { error: insertError } = await supabase.from('item_options').insert(optionRows)

      if (insertError) {
        console.error('Failed to insert new options:', insertError)
        return NextResponse.json({ error: 'Failed to save options' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ data: item ?? { id } })
}

// DELETE /api/admin/menu/[id] — delete menu item
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()

  // item_options will cascade delete if FK is set; delete explicitly to be safe
  await supabase.from('item_options').delete().eq('item_id', id)

  const { error } = await supabase.from('menu_items').delete().eq('id', id)

  if (error) {
    console.error('Failed to delete menu item:', error)
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
