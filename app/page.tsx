import { createClient } from '@/lib/supabase/server'
import type { StoreHours } from '@/lib/types'
import { isStoreOpen } from '@/lib/store-hours'
import { Header } from '@/components/header'
import { StoreStatusBanner } from '@/components/store-status-banner'
import { MenuGrid } from '@/components/menu-grid'

export default async function Home() {
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
      .select('*')
      .eq('key', 'store_hours')
      .single(),
  ])

  const categories = categoriesResult.data ?? []
  const items = itemsResult.data ?? []
  const storeHours = settingsResult.data?.value as StoreHours | undefined

  const storeOpen = storeHours ? isStoreOpen(storeHours) : false

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
