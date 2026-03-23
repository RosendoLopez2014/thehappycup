import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId

    if (!orderId) {
      console.error('Webhook: missing orderId in session metadata', session.id)
      return NextResponse.json({ received: true })
    }

    const supabase = createAdminClient()

    // Update order payment status to paid and status to confirmed
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Webhook: failed to update order status:', updateError)
    }

    // Fetch order to get customer and total for loyalty points
    const { data: order, error: orderFetchError } = await supabase
      .from('orders')
      .select('customer_id, total')
      .eq('id', orderId)
      .single()

    if (orderFetchError) {
      console.error('Webhook: failed to fetch order:', orderFetchError)
      return NextResponse.json({ received: true })
    }

    if (order?.customer_id) {
      const pointsEarned = Math.floor(order.total)

      // Insert loyalty points ledger entry
      const { error: ledgerError } = await supabase.from('loyalty_points').insert({
        customer_id: order.customer_id,
        order_id: orderId,
        points: pointsEarned,
        type: 'earned',
        description: `Earned from order`,
      })

      if (ledgerError) {
        console.error('Webhook: failed to insert loyalty points:', ledgerError)
      }

      // Attempt atomic increment via RPC
      const { error: rpcError } = await supabase.rpc('increment_points', {
        customer_id_param: order.customer_id,
        points_param: pointsEarned,
      })

      if (rpcError) {
        // Fallback: fetch current balance then update
        const { data: customer } = await supabase
          .from('customers')
          .select('points_balance')
          .eq('id', order.customer_id)
          .single()

        if (customer) {
          await supabase
            .from('customers')
            .update({ points_balance: customer.points_balance + pointsEarned })
            .eq('id', order.customer_id)
        }
      }

      // Record points earned on the order
      await supabase
        .from('orders')
        .update({ points_earned: pointsEarned })
        .eq('id', orderId)
    }
  }

  return NextResponse.json({ received: true })
}
