'use client'

import { useState } from 'react'
import type { DeliveryZone } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Trash2, Plus } from 'lucide-react'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

interface DeliveryZoneManagerProps {
  initialZones: DeliveryZone[]
}

export function DeliveryZoneManager({ initialZones }: DeliveryZoneManagerProps) {
  const [zones, setZones] = useState<DeliveryZone[]>(initialZones)
  const [zipCode, setZipCode] = useState('')
  const [deliveryFee, setDeliveryFee] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const fee = parseFloat(deliveryFee)
    if (!zipCode.trim()) {
      setAddError('Zip code is required')
      return
    }
    if (isNaN(fee) || fee < 0) {
      setAddError('Delivery fee must be a non-negative number')
      return
    }

    setAdding(true)
    setAddError(null)

    try {
      const res = await fetch('/api/admin/delivery-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: zipCode.trim(), deliveryFee: fee }),
      })
      const json = await res.json()
      if (!res.ok) {
        setAddError(json.error ?? 'Failed to add zone')
        return
      }
      setZones((prev) => [...prev, json.data])
      setZipCode('')
      setDeliveryFee('')
    } catch {
      setAddError('Network error — please try again')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('Remove this delivery zone?')) return

    setRemovingId(id)
    try {
      const res = await fetch('/api/admin/delivery-zones', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        console.error('Failed to remove zone:', json.error)
        return
      }
      setZones((prev) => prev.filter((z) => z.id !== id))
    } catch {
      console.error('Network error removing zone')
    } finally {
      setRemovingId(null)
    }
  }

  async function handleToggle(zone: DeliveryZone) {
    setTogglingId(zone.id)
    try {
      const res = await fetch('/api/admin/delivery-zones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: zone.id, is_active: !zone.is_active }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        console.error('Failed to toggle zone:', json.error)
        return
      }
      setZones((prev) =>
        prev.map((z) => (z.id === zone.id ? { ...z, is_active: !z.is_active } : z))
      )
    } catch {
      console.error('Network error toggling zone')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Zone Form */}
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
        <div className="flex gap-3 flex-1">
          <div className="space-y-1.5 flex-1 min-w-0">
            <Label htmlFor="zip-code">Zip Code</Label>
            <Input
              id="zip-code"
              type="text"
              placeholder="e.g. 90210"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <Label htmlFor="delivery-fee">Delivery Fee ($)</Label>
            <Input
              id="delivery-fee"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 3.99"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        <Button type="submit" disabled={adding} className="w-full sm:w-auto min-h-[44px]">
          {adding ? (
            <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Adding…</>
          ) : (
            <><Plus className="w-4 h-4 mr-1.5" /> Add Zone</>
          )}
        </Button>
        {addError && <p className="w-full text-sm text-red-600">{addError}</p>}
      </form>

      {/* Zones List */}
      {zones.length === 0 ? (
        <p className="text-sm text-warm-400">No delivery zones configured yet.</p>
      ) : (
        <div className="rounded-xl border border-warm-200 divide-y divide-warm-100">
          {zones.map((zone) => (
            <div key={zone.id} className="flex items-center gap-3 px-4 py-3 min-w-0">
              <span className="font-mono font-medium text-warm-700 w-20 shrink-0">{zone.zip_code}</span>
              <span className="text-warm-500 flex-1 min-w-0">{formatCurrency(zone.delivery_fee)}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-warm-400 hidden sm:inline">{zone.is_active ? 'Active' : 'Inactive'}</span>
                <Switch
                  checked={zone.is_active}
                  disabled={togglingId === zone.id}
                  onCheckedChange={() => handleToggle(zone)}
                  aria-label={`Toggle zone ${zone.zip_code}`}
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                disabled={removingId === zone.id}
                onClick={() => handleRemove(zone.id)}
                className="text-warm-400 hover:text-red-500 h-9 w-9 shrink-0 min-h-[44px] min-w-[44px]"
                aria-label={`Remove zone ${zone.zip_code}`}
              >
                {removingId === zone.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
