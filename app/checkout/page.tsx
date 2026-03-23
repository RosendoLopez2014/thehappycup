import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { CheckoutForm } from '@/components/checkout-form'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Checkout' }

interface CheckoutPageProps {
  searchParams: Promise<{
    orderType?: string
    deliveryAddress?: string
    deliveryCity?: string
    deliveryZip?: string
    deliveryFee?: string
    notes?: string
  }>
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams

  const orderType = params.orderType === 'delivery' ? 'delivery' : 'pickup'
  const deliveryAddress = params.deliveryAddress ?? ''
  const deliveryCity = params.deliveryCity ?? ''
  const deliveryZip = params.deliveryZip ?? ''
  const deliveryFee = orderType === 'delivery' ? parseFloat(params.deliveryFee ?? '0') || 0 : 0
  const notes = params.notes ?? ''

  // Try to load logged-in customer profile
  let customerId: string | undefined
  let customerName = ''
  let customerEmail = ''
  let customerPhone = ''
  let pointsBalance = 0

  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: customer } = await supabase
        .from('customers')
        .select('id, name, email, phone, points_balance')
        .eq('user_id', user.id)
        .single()

      if (customer) {
        customerId = customer.id
        customerName = customer.name ?? ''
        customerEmail = customer.email ?? ''
        customerPhone = customer.phone ?? ''
        pointsBalance = customer.points_balance ?? 0
      }
    }
  } catch {
    // Not logged in or error — proceed as guest
  }

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-semibold text-warm-600 mb-6">Checkout</h1>

        <Suspense>
          <CheckoutForm
            orderType={orderType}
            deliveryAddress={deliveryAddress}
            deliveryCity={deliveryCity}
            deliveryZip={deliveryZip}
            deliveryFee={deliveryFee}
            notes={notes}
            customerId={customerId}
            customerName={customerName}
            customerEmail={customerEmail}
            customerPhone={customerPhone}
            pointsBalance={pointsBalance}
          />
        </Suspense>
      </main>
    </>
  )
}
