'use client'

import { useEffect, useState } from 'react'
import type { StoreHours } from '@/lib/types'
import { isStoreOpen, getNextOpenTime } from '@/lib/store-hours'

interface StoreStatusBannerProps {
  storeHours: StoreHours
}

export function StoreStatusBanner({ storeHours }: StoreStatusBannerProps) {
  const [open, setOpen] = useState(true) // optimistic: assume open until checked

  useEffect(() => {
    function check() {
      setOpen(isStoreOpen(storeHours))
    }

    check()

    const interval = setInterval(check, 60_000)
    return () => clearInterval(interval)
  }, [storeHours])

  if (open) return null

  return (
    <div className="bg-warm-600 text-white text-sm text-center py-2.5 px-4">
      We&apos;re currently closed.&nbsp;{getNextOpenTime(storeHours)}
    </div>
  )
}
