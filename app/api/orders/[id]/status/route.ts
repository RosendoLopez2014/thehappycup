import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deductInventoryForOrder } from '@/lib/inventory'

const validTransitions: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'completed', 'cancelled'],
  out_for_delivery: ['completed', 'cancelled'],
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let status: string
  try {
    const body = await request.json()
    status = body.status
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fetch current order
  const { data: order } = await supabase
    .from('orders')
    .select('status, order_type')
    .eq('id', id)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Validate status transition
  const allowed = validTransitions[order.status] ?? []
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status transition from '${order.status}' to '${status}'` },
      { status: 400 }
    )
  }

  // Pickup orders cannot go out for delivery
  if (order.order_type === 'pickup' && status === 'out_for_delivery') {
    return NextResponse.json(
      { error: 'Pickup orders cannot be out for delivery' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Auto-deduct inventory when order is confirmed
  if (status === 'confirmed') {
    try {
      const result = await deductInventoryForOrder(id)
      if (result.errors.length > 0) {
        console.error('[inventory] Deduction errors for order', id, result.errors)
      }
      if (result.deducted.length > 0) {
        console.log('[inventory] Deducted for order', id, result.deducted)
      }
      if (result.lowStock.length > 0) {
        console.warn('[inventory] Low stock after order', id, result.lowStock)
      }
    } catch (inventoryErr) {
      // Log but do not fail the status update
      console.error('[inventory] Unexpected error deducting inventory for order', id, inventoryErr)
    }
  }

  return NextResponse.json(data)
}
