import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { OrderCard } from './order-card'
import type { Order, OrderItem, Customer } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Order History' }

export default async function OrderHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single<Pick<Customer, 'id'>>()

  if (!customer) {
    redirect('/auth/login')
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .returns<Order[]>()

  const allOrders = orders ?? []

  // Fetch items for all orders
  let itemsByOrder: Record<string, OrderItem[]> = {}
  if (allOrders.length > 0) {
    const orderIds = allOrders.map((o) => o.id)
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds)
      .returns<OrderItem[]>()

    if (items) {
      for (const item of items) {
        if (!itemsByOrder[item.order_id]) {
          itemsByOrder[item.order_id] = []
        }
        itemsByOrder[item.order_id].push(item)
      }
    }
  }

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">

        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="text-sm text-warm-500 hover:text-warm-700 transition-colors"
          >
            ← Profile
          </Link>
          <h1 className="text-2xl font-semibold text-warm-800">Order History</h1>
        </div>

        {allOrders.length === 0 ? (
          <div className="bg-white border border-warm-200 rounded-2xl p-10 text-center shadow-sm">
            <p className="text-4xl mb-4">🧋</p>
            <p className="text-warm-700 font-medium mb-1">No orders yet</p>
            <p className="text-sm text-warm-500 mb-4">Start ordering to see your history here.</p>
            <Link
              href="/"
              className="inline-block text-sm font-medium text-warm-600 bg-warm-100 hover:bg-warm-200 px-4 py-2 rounded-lg transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {allOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                items={itemsByOrder[order.id] ?? []}
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
