import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { LogOutButton } from './log-out-button'
import type { Customer, LoyaltyPoints } from '@/lib/types'

export const metadata: Metadata = { title: 'My Profile' }

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function pointsTypeLabel(type: string) {
  if (type === 'earned') return 'Earned'
  if (type === 'redeemed') return 'Redeemed'
  return 'Adjustment'
}

function pointsTypeColor(type: string) {
  if (type === 'earned') return 'text-green-600'
  if (type === 'redeemed') return 'text-red-500'
  return 'text-warm-500'
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', user.id)
    .single<Customer>()

  if (!customer) {
    redirect('/auth/login')
  }

  const { data: pointsHistory } = await supabase
    .from('loyalty_points')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(5)
    .returns<LoyaltyPoints[]>()

  const history = pointsHistory ?? []

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-warm-800">My Profile</h1>
          <LogOutButton />
        </div>

        {/* Customer info */}
        <div className="bg-white border border-warm-200 rounded-2xl p-6 flex flex-col gap-3 shadow-sm">
          <div>
            <p className="text-lg font-semibold text-warm-800">{customer.name}</p>
            <p className="text-sm text-warm-500">{customer.email}</p>
            {customer.phone && (
              <p className="text-sm text-warm-500">{customer.phone}</p>
            )}
          </div>
        </div>

        {/* Loyalty points */}
        <div className="bg-warm-600 text-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-medium text-warm-100 mb-1">Loyalty Points</p>
          <p className="text-4xl font-bold tracking-tight">
            ✦ {customer.points_balance} <span className="text-2xl font-semibold">points</span>
          </p>
          <p className="text-sm text-warm-200 mt-2">
            Earn 1 point per $1 spent. Redeem 50 points for $5 off.
          </p>
        </div>

        {/* Recent points history */}
        {history.length > 0 && (
          <div className="bg-white border border-warm-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-warm-700 uppercase tracking-wide mb-4">
              Recent Points Activity
            </h2>
            <ul className="flex flex-col divide-y divide-warm-100">
              {history.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm text-warm-800">
                      {entry.description ?? pointsTypeLabel(entry.type)}
                    </p>
                    <p className="text-xs text-warm-400">{formatDate(entry.created_at)}</p>
                  </div>
                  <span className={`text-sm font-semibold font-mono ${pointsTypeColor(entry.type)}`}>
                    {entry.type === 'redeemed' ? '-' : '+'}{entry.points}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/profile/orders"
            className="bg-white border border-warm-200 rounded-2xl p-5 shadow-sm hover:border-warm-400 hover:shadow transition-all flex flex-col gap-1"
          >
            <span className="text-lg">🧾</span>
            <p className="font-semibold text-warm-800">Order History</p>
            <p className="text-sm text-warm-500">View your past orders</p>
          </Link>

          <Link
            href="/profile/addresses"
            className="bg-white border border-warm-200 rounded-2xl p-5 shadow-sm hover:border-warm-400 hover:shadow transition-all flex flex-col gap-1"
          >
            <span className="text-lg">📍</span>
            <p className="font-semibold text-warm-800">Saved Addresses</p>
            <p className="text-sm text-warm-500">Manage delivery addresses</p>
          </Link>
        </div>

        {/* Payment methods */}
        <div className="bg-white border border-warm-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-warm-700 uppercase tracking-wide mb-2">
            Payment Methods
          </h2>
          {customer.stripe_customer_id ? (
            <p className="text-sm text-warm-600">
              Your saved cards are managed through Stripe and will appear automatically at checkout.
            </p>
          ) : (
            <p className="text-sm text-warm-500">
              Payment methods are managed through Stripe during checkout. Your saved cards will appear automatically at checkout.
            </p>
          )}
        </div>

      </main>
    </>
  )
}
