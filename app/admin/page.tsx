import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { OrderFeed } from '@/components/admin/order-feed'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Orders' }

async function fetchTodayStats() {
  const supabase = createAdminClient()

  // Start of today in UTC
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const { data: todayOrders } = await supabase
    .from('orders')
    .select('total, status')
    .gte('created_at', todayISO)
    .neq('status', 'cancelled')

  const orders = todayOrders ?? []
  const totalOrders = orders.length
  const revenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0)
  const pending = orders.filter(
    (o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing'
  ).length

  return { totalOrders, revenue, pending }
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-warm-200 px-5 py-4 shadow-sm">
      <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-warm-600 tracking-tight">{value}</p>
    </div>
  )
}

export default async function AdminOrdersPage() {
  const { totalOrders, revenue, pending } = await fetchTodayStats()

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold text-warm-600 mb-5">Orders</h1>

      {/* Today's stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Orders today" value={String(totalOrders)} />
        <StatCard label="Revenue today" value={fmt(revenue)} />
        <StatCard label="Active orders" value={String(pending)} />
      </div>

      {/* Live feed */}
      <OrderFeed />
    </div>
  )
}
