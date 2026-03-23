'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/components/cart-provider'
import type { CartItem } from '@/lib/types'

interface CheckoutFormProps {
  orderType: 'pickup' | 'delivery'
  deliveryAddress: string
  deliveryCity: string
  deliveryZip: string
  deliveryFee: number
  notes: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  pointsBalance: number
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

function formatSelectedOptions(selectedOptions: CartItem['selectedOptions']): string {
  const entries = Object.values(selectedOptions)
  if (entries.length === 0) return ''
  return entries.map((opt) => opt.name).join(', ')
}

export function CheckoutForm({
  orderType,
  deliveryAddress,
  deliveryCity,
  deliveryZip,
  deliveryFee,
  notes,
  customerId,
  customerName: initialName = '',
  customerEmail: initialEmail = '',
  customerPhone: initialPhone = '',
  pointsBalance,
}: CheckoutFormProps) {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCart()

  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [phone, setPhone] = useState(initialPhone)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash_venmo'>('card')
  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Points: redeemed in 50-point increments, $5 per 50 pts
  const maxRedeemablePoints = Math.floor(pointsBalance / 50) * 50
  const pointsDiscount = (pointsToRedeem / 50) * 5
  const total = Math.max(0, subtotal + deliveryFee - pointsDiscount)

  function handlePointsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = parseInt(e.target.value, 10)
    if (isNaN(raw) || raw < 0) {
      setPointsToRedeem(0)
      return
    }
    // Round down to nearest 50, cap at max redeemable
    const clamped = Math.min(Math.floor(raw / 50) * 50, maxRedeemablePoints)
    setPointsToRedeem(clamped)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (items.length === 0) {
      setError('Your cart is empty.')
      return
    }
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.')
      return
    }

    setIsSubmitting(true)

    try {
      // Step 1: Create order in Supabase
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          orderType,
          paymentMethod,
          customerName: name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim() || undefined,
          deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
          deliveryZip: orderType === 'delivery' ? deliveryZip : undefined,
          deliveryFee,
          notes: notes || undefined,
          pointsToRedeem,
          customerId: customerId ?? undefined,
        }),
      })

      const orderData = await orderRes.json()

      if (!orderRes.ok) {
        setError(orderData.error ?? 'Failed to create order.')
        return
      }

      const { orderId } = orderData as { orderId: string }

      // Step 2a: Card payment — redirect to Stripe Checkout
      if (paymentMethod === 'card') {
        const checkoutRes = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        })

        const checkoutData = await checkoutRes.json()

        if (!checkoutRes.ok) {
          setError(checkoutData.error ?? 'Failed to start checkout.')
          return
        }

        const { url } = checkoutData as { url: string }
        clearCart()
        window.location.href = url
        return
      }

      // Step 2b: Cash/Venmo — go straight to confirmation
      clearCart()
      router.push(`/confirmation?order_id=${orderId}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
      {/* Left column */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Contact info */}
        <section className="bg-white rounded-2xl border border-warm-200 p-5">
          <h2 className="text-base font-semibold text-warm-600 mb-4">Contact Information</h2>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name" className="text-warm-600 text-sm">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="border-warm-200 focus-visible:ring-warm-400"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-warm-600 text-sm">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="border-warm-200 focus-visible:ring-warm-400"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone" className="text-warm-600 text-sm">
                Phone (optional)
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 555-5555"
                className="border-warm-200 focus-visible:ring-warm-400"
              />
            </div>
          </div>
        </section>

        {/* Order type summary */}
        <section className="bg-white rounded-2xl border border-warm-200 p-5">
          <h2 className="text-base font-semibold text-warm-600 mb-3">Order Type</h2>
          <p className="text-sm text-warm-500 capitalize">{orderType}</p>
          {orderType === 'delivery' && (
            <p className="text-sm text-warm-400 mt-1">
              {deliveryAddress}{deliveryCity ? `, ${deliveryCity}` : ''} {deliveryZip}
            </p>
          )}
          {notes && (
            <p className="text-sm text-warm-400 mt-2 italic">&ldquo;{notes}&rdquo;</p>
          )}
        </section>

        {/* Payment method */}
        <section className="bg-white rounded-2xl border border-warm-200 p-5">
          <h2 className="text-base font-semibold text-warm-600 mb-4">Payment Method</h2>
          <div className="flex rounded-xl overflow-hidden border border-warm-200">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                paymentMethod === 'card'
                  ? 'bg-warm-600 text-white'
                  : 'bg-warm-100 text-warm-500 hover:bg-warm-200'
              }`}
            >
              Card (Stripe)
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('cash_venmo')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                paymentMethod === 'cash_venmo'
                  ? 'bg-warm-600 text-white'
                  : 'bg-warm-100 text-warm-500 hover:bg-warm-200'
              }`}
            >
              Cash / Venmo
            </button>
          </div>
          {paymentMethod === 'cash_venmo' && (
            <p className="text-xs text-warm-400 mt-3">
              Pay at pickup or send Venmo to @thehappycup before delivery.
            </p>
          )}
        </section>

        {/* Loyalty points */}
        {customerId && pointsBalance >= 50 && (
          <section className="bg-white rounded-2xl border border-warm-200 p-5">
            <h2 className="text-base font-semibold text-warm-600 mb-1">Redeem Points</h2>
            <p className="text-xs text-warm-400 mb-3">
              You have {pointsBalance} pts. Redeem in 50-pt increments ($5 off each).
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="points" className="text-warm-600 text-sm">
                Points to redeem (multiples of 50)
              </Label>
              <Input
                id="points"
                type="number"
                min={0}
                max={maxRedeemablePoints}
                step={50}
                value={pointsToRedeem}
                onChange={handlePointsChange}
                className="border-warm-200 focus-visible:ring-warm-400 w-40"
              />
              {pointsToRedeem > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  Saving {formatPrice(pointsDiscount)}
                </p>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Right column: order summary */}
      <aside className="lg:w-1/3">
        <div className="bg-white rounded-2xl border border-warm-200 p-5 sticky top-20">
          <h2 className="text-base font-semibold text-warm-600 mb-4">Order Summary</h2>

          {/* Line items */}
          <div className="flex flex-col gap-2 mb-4">
            {items.map((item) => {
              const opts = formatSelectedOptions(item.selectedOptions)
              return (
                <div
                  key={`${item.menuItemId}-${JSON.stringify(item.selectedOptions)}`}
                  className="flex justify-between text-sm"
                >
                  <span className="text-warm-500">
                    {item.quantity}× {item.name}
                    {opts && <span className="text-warm-400 text-xs block">{opts}</span>}
                  </span>
                  <span className="font-mono text-warm-600 shrink-0 ml-2">
                    {formatPrice(item.lineTotal)}
                  </span>
                </div>
              )
            })}
          </div>

          <Separator className="my-3 bg-warm-100" />

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-warm-500">
              <span>Subtotal</span>
              <span className="font-mono">{formatPrice(subtotal)}</span>
            </div>

            {orderType === 'delivery' && (
              <div className="flex justify-between text-warm-500">
                <span>Delivery fee</span>
                <span className="font-mono">{formatPrice(deliveryFee)}</span>
              </div>
            )}

            {pointsToRedeem > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Points discount</span>
                <span className="font-mono">-{formatPrice(pointsDiscount)}</span>
              </div>
            )}

            <Separator className="my-1 bg-warm-100" />

            <div className="flex justify-between font-semibold text-warm-600">
              <span>Total</span>
              <span className="font-mono">{formatPrice(total)}</span>
            </div>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || items.length === 0}
            className="w-full mt-6 bg-warm-600 hover:bg-warm-700 text-white rounded-xl disabled:opacity-50"
          >
            {isSubmitting
              ? 'Placing order…'
              : paymentMethod === 'card'
              ? 'Pay with Card'
              : 'Place Order'}
          </Button>
        </div>
      </aside>
    </form>
  )
}
