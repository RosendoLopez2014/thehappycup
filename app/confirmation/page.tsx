import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Order, OrderItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Order Confirmed' }

interface ConfirmationPageProps {
  searchParams: Promise<{ order_id?: string }>
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

function formatSelectedOptions(
  selectedOptions: Record<string, { name: string; priceAdjustment: number }>
): string {
  const entries = Object.values(selectedOptions)
  if (entries.length === 0) return ''
  return entries.map((opt) => opt.name).join(', ')
}

async function ConfirmationContent({ orderId }: { orderId: string }) {
  const supabase = createAdminClient()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    notFound()
  }

  const { data: orderItems } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  const typedOrder = order as Order
  const typedItems = (orderItems ?? []) as OrderItem[]

  const isCash = typedOrder.payment_method === 'cash_venmo'

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      {/* Success banner */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
        <CheckCircle className="w-12 h-12 text-green-500" />
        <h2 className="text-xl font-semibold text-green-700">
          {isCash ? 'Order Received!' : 'Payment Confirmed!'}
        </h2>
        <p className="text-sm text-green-600">
          {isCash
            ? 'Your order has been placed. Please pay with cash or Venmo at pickup/delivery.'
            : 'Your payment was successful and your order is being prepared.'}
        </p>
        <p className="text-xs text-green-500 font-mono">Order #{typedOrder.id}</p>
      </div>

      {/* Order details */}
      <div className="bg-white rounded-2xl border border-warm-200 p-5 flex flex-col gap-4">
        <h3 className="text-base font-semibold text-warm-600">Order Details</h3>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <span className="text-warm-400">Name</span>
          <span className="text-warm-600">{typedOrder.customer_name}</span>

          <span className="text-warm-400">Email</span>
          <span className="text-warm-600">{typedOrder.customer_email}</span>

          <span className="text-warm-400">Order type</span>
          <span className="text-warm-600 capitalize">{typedOrder.order_type}</span>

          {typedOrder.order_type === 'delivery' && typedOrder.delivery_address && (
            <>
              <span className="text-warm-400">Delivery address</span>
              <span className="text-warm-600">
                {typedOrder.delivery_address}, {typedOrder.delivery_zip}
              </span>
            </>
          )}

          <span className="text-warm-400">Payment</span>
          <span className="text-warm-600 capitalize">
            {typedOrder.payment_method === 'cash_venmo' ? 'Cash / Venmo' : 'Card'}
          </span>

          <span className="text-warm-400">Status</span>
          <span className="text-warm-600 capitalize">{typedOrder.status}</span>
        </div>

        <Separator className="bg-warm-100" />

        {/* Line items */}
        <div className="flex flex-col gap-2">
          {typedItems.map((item) => {
            const opts = formatSelectedOptions(
              item.selected_options as Record<string, { name: string; priceAdjustment: number }>
            )
            return (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-warm-500">
                  {item.quantity}× {item.item_name}
                  {opts && <span className="text-warm-400 text-xs block">{opts}</span>}
                </span>
                <span className="font-mono text-warm-600 shrink-0 ml-2">
                  {formatPrice(item.line_total)}
                </span>
              </div>
            )
          })}
        </div>

        <Separator className="bg-warm-100" />

        {/* Totals */}
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-warm-500">
            <span>Subtotal</span>
            <span className="font-mono">{formatPrice(typedOrder.subtotal)}</span>
          </div>

          {typedOrder.order_type === 'delivery' && typedOrder.delivery_fee > 0 && (
            <div className="flex justify-between text-warm-500">
              <span>Delivery fee</span>
              <span className="font-mono">{formatPrice(typedOrder.delivery_fee)}</span>
            </div>
          )}

          {typedOrder.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Points discount</span>
              <span className="font-mono">-{formatPrice(typedOrder.discount)}</span>
            </div>
          )}

          <div className="flex justify-between font-semibold text-warm-600 pt-1">
            <span>Total</span>
            <span className="font-mono">{formatPrice(typedOrder.total)}</span>
          </div>
        </div>

        {typedOrder.points_earned > 0 && (
          <p className="text-xs text-green-600 text-center pt-1">
            +{typedOrder.points_earned} loyalty points earned on this order!
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/">
          <Button className="w-full bg-warm-600 hover:bg-warm-700 text-white rounded-xl">
            Back to Menu
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const { order_id: orderId } = await searchParams

  if (!orderId) {
    notFound()
  }

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto w-full px-4 py-8 pb-safe">
        <h1 className="font-display text-2xl font-semibold text-warm-600 mb-6">Order Confirmation</h1>
        <Suspense fallback={<p className="text-warm-400 text-sm">Loading order…</p>}>
          <ConfirmationContent orderId={orderId} />
        </Suspense>
      </main>
    </>
  )
}
