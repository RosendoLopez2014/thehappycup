'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'

interface StoreToggleProps {
  initialOpen: boolean
}

export function StoreToggle({ initialOpen }: StoreToggleProps) {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [saving, setSaving] = useState(false)

  async function handleToggle(checked: boolean) {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'store_open', value: checked }),
      })
      if (res.ok) {
        setIsOpen(checked)
      }
    } catch (err) {
      console.error('Failed to toggle store status:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`flex items-center justify-between rounded-2xl border-2 p-5 transition-colors ${
      isOpen
        ? 'border-green-300 bg-green-50'
        : 'border-red-300 bg-red-50'
    }`}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-3 h-3 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="font-display text-lg font-bold text-warm-700">
            {isOpen ? 'STORE IS OPEN' : 'STORE IS CLOSED'}
          </span>
        </div>
        <p className="text-sm text-warm-400">
          {isOpen
            ? 'Customers can place orders now.'
            : 'Ordering is disabled. Customers can still browse the menu.'}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {saving && <Loader2 className="w-4 h-4 animate-spin text-warm-400" />}
        <Switch
          checked={isOpen}
          onCheckedChange={handleToggle}
          disabled={saving}
        />
      </div>
    </div>
  )
}
