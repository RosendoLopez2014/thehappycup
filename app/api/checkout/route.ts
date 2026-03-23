import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type { OrderItem } from '@/lib/types'

function formatOptions(
  selectedOptions: Record<string, { name: string; priceAdjustment: number }>
): string {
  const entries = Object.entries(selectedOptions)
  if (entries.length === 0) return ''
  return entries.map(([group, opt]) => `${group}: ${opt.name}`).join(', ')
}

export async function POST(request: Request) {
  let body: { orderId: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { orderId } = body
  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fetch order + order items
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  if (itemsError || !orderItems) {
    return NextResponse.json({ error: 'Order items not found' }, { status: 404 })
  }

  // Resolve Stripe customer ID
  let stripeCustomerId: string | undefined

  if (order.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('stripe_customer_id, email, name')
      .eq('id', order.customer_id)
      .single()

    if (customer?.stripe_customer_id) {
      stripeCustomerId = customer.stripe_customer_id
    } else if (customer) {
      // Create a new Stripe customer
      const stripeCustomer = await getStripe().customers.create({
        email: customer.email,
        name: customer.name,
      })
      stripeCustomerId = stripeCustomer.id

      // Save back to our customers table
      await supabase
        .from('customers')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', order.customer_id)
    }
  }

  // Build line items from order items
  const lineItems: {
    price_data: {
      currency: string
      product_data: { name: string; description?: string }
      unit_amount: number
    }
    quantity: number
  }[] = (orderItems as OrderItem[]).map((item) => {
    const description = formatOptions(
      item.selected_options as Record<string, { name: string; priceAdjustment: number }>
    )
    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.item_name,
          ...(description ? { description } : {}),
        },
        unit_amount: Math.round(item.unit_price * 100),
      },
      quantity: item.quantity,
    }
  })

  // Add delivery fee as a line item if applicable
  if (order.delivery_fee > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Delivery Fee' },
        unit_amount: Math.round(order.delivery_fee * 100),
      },
      quantity: 1,
    })
  }

  // Create one-time coupon for discount if applicable
  let discounts: { coupon: string }[] | undefined
  if (order.discount > 0) {
    const coupon = await getStripe().coupons.create({
      amount_off: Math.round(order.discount * 100),
      currency: 'usd',
      duration: 'once',
    })
    discounts = [{ coupon: coupon.id }]
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const session = await getStripe().checkout.sessions.create({
    ...(stripeCustomerId ? { customer: stripeCustomerId } : {}),
    line_items: lineItems,
    ...(discounts ? { discounts } : {}),
    mode: 'payment',
    success_url: `${siteUrl}/confirmation?order_id=${orderId}`,
    cancel_url: `${siteUrl}/cart`,
    metadata: { orderId },
    payment_intent_data: {
      ...(stripeCustomerId ? { setup_future_usage: 'on_session' as const } : {}),
    },
  })

  // Save session ID to order
  await supabase
    .from('orders')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', orderId)

  return NextResponse.json({ url: session.url })
}
