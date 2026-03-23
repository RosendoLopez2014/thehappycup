import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/admin/delivery-zones — list all delivery zones
export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('delivery_zones')
    .select('*')
    .order('zip_code', { ascending: true })

  if (error) {
    console.error('Failed to fetch delivery zones:', error)
    return NextResponse.json({ error: 'Failed to fetch delivery zones' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

// POST /api/admin/delivery-zones — add a zone
export async function POST(request: Request) {
  let zipCode: string
  let deliveryFee: number

  try {
    const body = await request.json()
    zipCode = body.zipCode
    deliveryFee = body.deliveryFee
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!zipCode || deliveryFee == null) {
    return NextResponse.json({ error: 'zipCode and deliveryFee are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('delivery_zones')
    .insert({ zip_code: zipCode, delivery_fee: deliveryFee, is_active: true })
    .select()
    .single()

  if (error) {
    console.error('Failed to create delivery zone:', error)
    return NextResponse.json({ error: 'Failed to create delivery zone' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

// PATCH /api/admin/delivery-zones — update a zone (e.g. toggle is_active)
export async function PATCH(request: Request) {
  let id: string
  let is_active: boolean

  try {
    const body = await request.json()
    id = body.id
    is_active = body.is_active
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!id || is_active === undefined) {
    return NextResponse.json({ error: 'id and is_active are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('delivery_zones')
    .update({ is_active })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update delivery zone:', error)
    return NextResponse.json({ error: 'Failed to update delivery zone' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// DELETE /api/admin/delivery-zones — remove a zone
export async function DELETE(request: Request) {
  let id: string

  try {
    const body = await request.json()
    id = body.id
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('delivery_zones')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete delivery zone:', error)
    return NextResponse.json({ error: 'Failed to delete delivery zone' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
