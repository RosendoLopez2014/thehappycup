import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import type { DeliveryZone, StoreHours, StoreSetting } from '@/lib/types'
import { DeliveryZoneManager } from '@/components/admin/delivery-zone-manager'
import { StoreHoursForm } from '@/components/admin/store-hours-form'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = { title: 'Settings' }

export default async function AdminSettingsPage() {
  const supabase = createAdminClient()

  const [{ data: zones }, { data: settings }] = await Promise.all([
    supabase.from('delivery_zones').select('*').order('zip_code', { ascending: true }),
    supabase.from('store_settings').select('*'),
  ])

  const storeHoursSetting = (settings as StoreSetting[] | null)?.find(
    (s) => s.key === 'store_hours'
  )
  const storeHours = storeHoursSetting?.value as StoreHours | undefined

  return (
    <div className="p-6 space-y-10 max-w-3xl">
      <h1 className="text-2xl font-bold text-warm-700">Settings</h1>

      {/* Delivery Zones */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-warm-700">Delivery Zones</h2>
          <p className="text-sm text-warm-400 mt-0.5">
            Manage zip codes and delivery fees for your service area.
          </p>
        </div>
        <DeliveryZoneManager initialZones={(zones as DeliveryZone[]) ?? []} />
      </section>

      <Separator />

      {/* Store Hours */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-warm-700">Store Hours</h2>
          <p className="text-sm text-warm-400 mt-0.5">
            Set your opening and closing times for each day of the week.
          </p>
        </div>
        <StoreHoursForm initialHours={storeHours ?? null} />
      </section>
    </div>
  )
}
