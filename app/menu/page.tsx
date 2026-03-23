import { createClient } from '@/lib/supabase/server'
import type { StoreHours } from '@/lib/types'
import { isStoreOpen } from '@/lib/store-hours'
import { Header } from '@/components/header'
import { StoreStatusBanner } from '@/components/store-status-banner'
import { MenuGrid } from '@/components/menu-grid'

export const dynamic = 'force-dynamic'

export default async function MenuPage() {
  const supabase = await createClient()

  const [categoriesResult, itemsResult, settingsResult] = await Promise.all([
    supabase
      .from('menu_categories')
      .select('*')
      .order('display_order'),
    supabase
      .from('menu_items')
      .select('*, item_options(*)')
      .eq('is_available', true)
      .order('display_order'),
    supabase
      .from('store_settings')
      .select('*'),
  ])

  const categories = categoriesResult.data ?? []
  const items = itemsResult.data ?? []
  const settings = settingsResult.data ?? []

  const storeHours = settings.find((s) => s.key === 'store_hours')?.value as StoreHours | undefined
  const storeOpenToggle = settings.find((s) => s.key === 'store_open')?.value

  // Store is open only if the manual toggle is ON
  const storeOpen = storeOpenToggle === true

  return (
    <>
      <Header />
      {storeHours && <StoreStatusBanner storeHours={storeHours} />}
      <main className="max-w-5xl mx-auto w-full">
        <MenuGrid items={items} categories={categories} storeOpen={storeOpen} />
      </main>
    </>
  )
}
