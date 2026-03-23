'use client'

import { useState } from 'react'
import type { StoreHours, DayHours } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

const DAYS = [
  { key: 'monday',    label: 'Monday' },
  { key: 'tuesday',  label: 'Tuesday' },
  { key: 'wednesday',label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday',   label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday',   label: 'Sunday' },
] as const

type DayKey = typeof DAYS[number]['key']

const DEFAULT_HOURS: StoreHours = {
  monday:    { open: '07:00', close: '19:00' },
  tuesday:   { open: '07:00', close: '19:00' },
  wednesday: { open: '07:00', close: '19:00' },
  thursday:  { open: '07:00', close: '19:00' },
  friday:    { open: '07:00', close: '19:00' },
  saturday:  { open: '08:00', close: '17:00' },
  sunday:    { open: '08:00', close: '17:00' },
}

interface StoreHoursFormProps {
  initialHours?: StoreHours | null
}

export function StoreHoursForm({ initialHours }: StoreHoursFormProps) {
  const [hours, setHours] = useState<StoreHours>(initialHours ?? DEFAULT_HOURS)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  function updateDay(day: DayKey, field: keyof DayHours, value: string) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
    setSaveSuccess(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'store_hours', value: hours }),
      })
      const json = await res.json()
      if (!res.ok) {
        setSaveError(json.error ?? 'Failed to save store hours')
        return
      }
      setSaveSuccess(true)
    } catch {
      setSaveError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="rounded-xl border border-warm-200 divide-y divide-warm-100">
        {/* Header */}
        <div className="grid grid-cols-3 gap-4 px-4 py-2.5 bg-warm-50 text-xs font-semibold text-warm-500 uppercase tracking-wide">
          <span>Day</span>
          <span>Opens</span>
          <span>Closes</span>
        </div>

        {DAYS.map(({ key, label }) => (
          <div key={key} className="grid grid-cols-3 gap-4 items-center px-4 py-3">
            <span className="text-sm font-medium text-warm-700">{label}</span>
            <div>
              <Label htmlFor={`${key}-open`} className="sr-only">
                {label} open time
              </Label>
              <Input
                id={`${key}-open`}
                type="time"
                value={hours[key].open}
                onChange={(e) => updateDay(key, 'open', e.target.value)}
                className="w-32"
              />
            </div>
            <div>
              <Label htmlFor={`${key}-close`} className="sr-only">
                {label} close time
              </Label>
              <Input
                id={`${key}-close`}
                type="time"
                value={hours[key].close}
                onChange={(e) => updateDay(key, 'close', e.target.value)}
                className="w-32"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</>
          ) : (
            'Save Hours'
          )}
        </Button>
        {saveSuccess && (
          <p className="text-sm text-emerald-600 font-medium">Store hours saved.</p>
        )}
        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
      </div>
    </form>
  )
}
