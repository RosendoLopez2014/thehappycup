import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let points: number
  let description: string

  try {
    const body = await request.json()
    points = body.points
    description = body.description
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (points == null || !description) {
    return NextResponse.json(
      { error: 'points and description are required' },
      { status: 400 }
    )
  }

  if (typeof points !== 'number' || !Number.isInteger(points)) {
    return NextResponse.json({ error: 'points must be an integer' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fetch the current customer to verify they exist and get current balance
  const { data: customer, error: fetchError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  // Insert loyalty_points record
  const { error: insertError } = await supabase.from('loyalty_points').insert({
    customer_id: id,
    points,
    type: 'adjustment',
    description,
  })

  if (insertError) {
    console.error('Failed to insert loyalty points:', insertError)
    return NextResponse.json({ error: 'Failed to record points adjustment' }, { status: 500 })
  }

  // Atomically update points_balance
  const newBalance = (customer.points_balance ?? 0) + points

  const { data: updated, error: updateError } = await supabase
    .from('customers')
    .update({ points_balance: newBalance })
    .eq('id', id)
    .select()
    .single()

  if (updateError || !updated) {
    console.error('Failed to update points balance:', updateError)
    return NextResponse.json({ error: 'Points recorded but balance update failed' }, { status: 500 })
  }

  return NextResponse.json({ data: updated })
}
