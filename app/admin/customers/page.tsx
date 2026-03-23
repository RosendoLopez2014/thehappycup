import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { CustomerTable } from '@/components/admin/customer-table'
import type { CustomerWithStats } from '@/components/admin/customer-table'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Customers' }

export default async function AdminCustomersPage() {
  const supabase = createAdminClient()

  // Fetch all customers
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  if (customersError) {
    console.error('Failed to fetch customers:', customersError)
  }

  // Fetch order stats grouped by customer_id
  const { data: orderStats, error: statsError } = await supabase
    .from('orders')
    .select('customer_id, total')
    .not('customer_id', 'is', null)

  if (statsError) {
    console.error('Failed to fetch order stats:', statsError)
  }

  // Aggregate order stats per customer
  const statsMap = new Map<string, { order_count: number; total_spent: number }>()
  for (const row of orderStats ?? []) {
    if (!row.customer_id) continue
    const existing = statsMap.get(row.customer_id) ?? { order_count: 0, total_spent: 0 }
    statsMap.set(row.customer_id, {
      order_count: existing.order_count + 1,
      total_spent: existing.total_spent + (row.total ?? 0),
    })
  }

  const customersWithStats: CustomerWithStats[] = (customers ?? []).map((c) => {
    const stats = statsMap.get(c.id) ?? { order_count: 0, total_spent: 0 }
    return { ...c, ...stats }
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-700">Customers</h1>
          <p className="text-sm text-warm-400 mt-0.5">
            {customersWithStats.length} registered customer{customersWithStats.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <CustomerTable initialCustomers={customersWithStats} />
    </div>
  )
}
