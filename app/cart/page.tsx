'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { CartSummary } from '@/components/cart-summary'
import { DeliveryForm } from '@/components/delivery-form'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/components/cart-provider'

interface DeliveryInfo {
  address: string
  city: string
  zip: string
  fee: number
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

export default function CartPage() {
  const { items, subtotal } = useCart()
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup')
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null)
  const [notes, setNotes] = useState('')

  const deliveryFee = orderType === 'delivery' && deliveryInfo ? deliveryInfo.fee : 0
  const total = subtotal + deliveryFee

  const isDeliveryInvalid = orderType === 'delivery' && !deliveryInfo
  const canProceed = items.length > 0 && !isDeliveryInvalid

  // Build checkout URL params to pass order context forward
  const checkoutParams = new URLSearchParams({
    orderType,
    ...(deliveryInfo && {
      deliveryAddress: deliveryInfo.address,
      deliveryCity: deliveryInfo.city,
      deliveryZip: deliveryInfo.zip,
      deliveryFee: String(deliveryInfo.fee),
    }),
    ...(notes && { notes }),
  })

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-semibold text-warm-600 mb-6">Your Cart</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column: cart items + delivery form */}
          <div className="flex-1 lg:w-2/3 flex flex-col gap-6">
            <CartSummary />

            {items.length > 0 && (
              <section className="bg-white rounded-2xl border border-warm-200 p-5">
                <h2 className="text-base font-semibold text-warm-600 mb-4">
                  Order Details
                </h2>
                <DeliveryForm
                  orderType={orderType}
                  onOrderTypeChange={setOrderType}
                  onDeliveryInfoChange={setDeliveryInfo}
                  onNotesChange={setNotes}
                />
              </section>
            )}
          </div>

          {/* Right column: order summary sidebar */}
          <aside className="lg:w-1/3">
            <div className="bg-white rounded-2xl border border-warm-200 p-5 sticky top-20">
              <h2 className="text-base font-semibold text-warm-600 mb-4">
                Order Summary
              </h2>

              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between text-warm-500">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatPrice(subtotal)}</span>
                </div>

                {orderType === 'delivery' && (
                  <div className="flex justify-between text-warm-500">
                    <span>Delivery fee</span>
                    <span className="font-mono">
                      {deliveryInfo
                        ? formatPrice(deliveryFee)
                        : '—'}
                    </span>
                  </div>
                )}

                {/* Points discount — placeholder for checkout task */}
                <div className="flex justify-between text-warm-400">
                  <span>Points discount</span>
                  <span className="font-mono">$0.00</span>
                </div>

                <Separator className="my-1 bg-warm-100" />

                <div className="flex justify-between font-semibold text-warm-600">
                  <span>Total</span>
                  <span className="font-mono">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-6">
                {canProceed ? (
                  <Link href={`/checkout?${checkoutParams.toString()}`}>
                    <Button className="w-full bg-warm-600 hover:bg-warm-700 text-white rounded-xl">
                      Proceed to Checkout
                    </Button>
                  </Link>
                ) : (
                  <Button
                    disabled
                    className="w-full rounded-xl"
                    title={
                      items.length === 0
                        ? 'Your cart is empty'
                        : 'Enter a valid delivery zip code'
                    }
                  >
                    Proceed to Checkout
                  </Button>
                )}

                {isDeliveryInvalid && items.length > 0 && (
                  <p className="text-xs text-center text-warm-400">
                    Enter a valid delivery zip to continue
                  </p>
                )}

                <Link
                  href="/"
                  className="text-sm text-center text-warm-500 hover:text-warm-600 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  )
}
