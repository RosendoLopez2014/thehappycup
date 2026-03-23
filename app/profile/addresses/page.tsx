import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { AddressManager } from './address-manager'
import type { Customer, CustomerAddress } from '@/lib/types'

export const metadata: Metadata = { title: 'Saved Addresses' }

export default async function AddressesPage() {
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

  const { data: addresses } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('customer_id', customer.id)
    .order('is_default', { ascending: false })
    .returns<CustomerAddress[]>()

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
          <h1 className="text-2xl font-semibold text-warm-800">Saved Addresses</h1>
        </div>

        <AddressManager
          customerId={customer.id}
          initialAddresses={addresses ?? []}
        />
      </main>
    </>
  )
}
