import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CartItem } from '@/lib/types'
import { resend } from '@/lib/resend'
import OrderConfirmationEmail from '@/components/email/order-confirmation'

interface OrderRequest {
  items: CartItem[]
  orderType: 'pickup' | 'delivery'
  paymentMethod: 'card' | 'cash_venmo'
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryAddress?: string
  deliveryZip?: string
  deliveryFee: number
  notes?: string
  pointsToRedeem: number
  customerId?: string
}

export async function POST(request: Request) {
  let body: OrderRequest

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const {
    items,
    orderType,
    paymentMethod,
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress,
    deliveryZip,
    deliveryFee,
    notes,
    pointsToRedeem,
    customerId,
  } = body

  // Validate required fields
  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }
  if (!customerName || !customerEmail) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }
  if (orderType === 'delivery' && (!deliveryAddress || !deliveryZip)) {
    return NextResponse.json({ error: 'Delivery address and zip are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Verify delivery zip is in an active zone
  if (orderType === 'delivery' && deliveryZip) {
    const { data: zone, error: zoneError } = await supabase
      .from('delivery_zones')
      .select('id, is_active')
      .eq('zip_code', deliveryZip)
      .eq('is_active', true)
      .single()

    if (zoneError || !zone) {
      return NextResponse.json(
        { error: 'Delivery is not available for this zip code' },
        { status: 400 }
      )
    }
  }

  // Validate points redemption
  if (pointsToRedeem < 0 || pointsToRedeem % 50 !== 0) {
    return NextResponse.json(
      { error: 'Points must be redeemed in 50-point increments' },
      { status: 400 }
    )
  }

  // Calculate subtotal from items
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)

  // Calculate discount: 50 points = $5
  const discount = (pointsToRedeem / 50) * 5

  // Calculate total
  const total = Math.max(0, subtotal + (deliveryFee ?? 0) - discount)

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: customerId ?? null,
      status: 'pending',
      order_type: orderType,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'cash_venmo' ? 'pending' : 'pending',
      stripe_checkout_session_id: null,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone ?? null,
      delivery_address: deliveryAddress ?? null,
      delivery_zip: deliveryZip ?? null,
      delivery_fee: deliveryFee ?? 0,
      subtotal,
      discount,
      total,
      notes: notes ?? null,
      points_earned: 0,
      points_redeemed: pointsToRedeem,
    })
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('Order creation error:', orderError)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  // Create order items
  const orderItems = items.map((item) => ({
    order_id: order.id,
    menu_item_id: item.menuItemId,
    item_name: item.name,
    quantity: item.quantity,
    unit_price: item.price,
    selected_options: item.selectedOptions,
    line_total: item.lineTotal,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

  if (itemsError) {
    console.error('Order items creation error:', itemsError)
    // Attempt cleanup
    await supabase.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
  }

  // Handle points redemption
  if (pointsToRedeem > 0 && customerId) {
    const { error: pointsLedgerError } = await supabase.from('loyalty_points').insert({
      customer_id: customerId,
      order_id: order.id,
      points: -pointsToRedeem,
      type: 'redeemed',
      description: `Redeemed ${pointsToRedeem} points on order`,
    })

    if (pointsLedgerError) {
      console.error('Points ledger error:', pointsLedgerError)
    }

    // Atomic decrement via raw update
    const { error: pointsUpdateError } = await supabase.rpc('decrement_points', {
      customer_id_param: customerId,
      points_param: pointsToRedeem,
    })

    if (pointsUpdateError) {
      // Fallback: fetch and update
      const { data: customer } = await supabase
        .from('customers')
        .select('points_balance')
        .eq('id', customerId)
        .single()

      if (customer) {
        await supabase
          .from('customers')
          .update({ points_balance: Math.max(0, customer.points_balance - pointsToRedeem) })
          .eq('id', customerId)
      }
    }
  }

  // Send order confirmation email (non-blocking — failure does not cancel the order)
  if (resend) {
    try {
      const fmt = (n: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

      const emailItems = items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        options: Object.values(item.selectedOptions)
          .map((o) => o.name)
          .join(', '),
        price: fmt(item.lineTotal),
      }))

      const estimatedTime =
        orderType === 'delivery' ? '45–60 minutes' : '15–20 minutes'

      await resend.emails.send({
        from: 'The Happy Cup <onboarding@resend.dev>',
        to: customerEmail,
        subject: `Order Confirmed — The Happy Cup #${order.id.slice(0, 8)}`,
        react: OrderConfirmationEmail({
          orderNumber: order.id.slice(0, 8),
          customerName,
          items: emailItems,
          subtotal: fmt(subtotal),
          discount: fmt(discount),
          deliveryFee: fmt(deliveryFee ?? 0),
          total: fmt(total),
          orderType,
          deliveryAddress: deliveryAddress ?? undefined,
          paymentMethod,
          paymentStatus: paymentMethod === 'cash_venmo' ? 'pending' : 'pending',
          estimatedTime,
        }),
      })
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError)
    }
  }

  return NextResponse.json({ orderId: order.id }, { status: 201 })
}
