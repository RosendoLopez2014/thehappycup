import type { Metadata } from 'next'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { LowStockAlert } from '@/components/admin/low-stock-alert'

export const metadata: Metadata = {
  title: {
    template: '%s | Admin — The Happy Cup',
    default: 'Admin — The Happy Cup',
  },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-warm-50">
      <AdminSidebar />

      {/* Main content — mt-16 on mobile accounts for sticky top bar height */}
      <main className="flex-1 min-w-0 overflow-auto mt-16 md:mt-0">
        <LowStockAlert />
        {children}
      </main>
    </div>
  )
}
