'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'

interface DeliveryInfo {
  address: string
  city: string
  zip: string
  fee: number
}

interface DeliveryFormProps {
  onOrderTypeChange: (type: 'pickup' | 'delivery') => void
  onDeliveryInfoChange: (info: DeliveryInfo | null) => void
  onNotesChange: (notes: string) => void
  orderType: 'pickup' | 'delivery'
}

export function DeliveryForm({
  onOrderTypeChange,
  onDeliveryInfoChange,
  onNotesChange,
  orderType,
}: DeliveryFormProps) {
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [zip, setZip] = useState('')
  const [notes, setNotes] = useState('')
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null)
  const [zipError, setZipError] = useState<string | null>(null)
  const [zipValidating, setZipValidating] = useState(false)

  async function validateZip(zipCode: string) {
    if (!zipCode.trim()) {
      setDeliveryFee(null)
      setZipError(null)
      onDeliveryInfoChange(null)
      return
    }

    setZipValidating(true)
    setZipError(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('zip_code', zipCode.trim())
        .eq('is_active', true)
        .single()

      if (error || !data) {
        setDeliveryFee(null)
        setZipError("We don't deliver to this area yet")
        onDeliveryInfoChange(null)
      } else {
        setDeliveryFee(data.delivery_fee)
        setZipError(null)
        onDeliveryInfoChange({
          address,
          city,
          zip: zipCode.trim(),
          fee: data.delivery_fee,
        })
      }
    } catch {
      setDeliveryFee(null)
      setZipError("We don't deliver to this area yet")
      onDeliveryInfoChange(null)
    } finally {
      setZipValidating(false)
    }
  }

  function handleOrderTypeChange(type: 'pickup' | 'delivery') {
    onOrderTypeChange(type)
    if (type === 'pickup') {
      onDeliveryInfoChange(null)
      setDeliveryFee(null)
      setZipError(null)
    }
  }

  function handleNotesChange(value: string) {
    setNotes(value)
    onNotesChange(value)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Order type toggle */}
      <div className="flex rounded-xl overflow-hidden border border-warm-200">
        <button
          type="button"
          onClick={() => handleOrderTypeChange('pickup')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            orderType === 'pickup'
              ? 'bg-warm-600 text-white'
              : 'bg-warm-100 text-warm-500 hover:bg-warm-200'
          }`}
        >
          Pickup
        </button>
        <button
          type="button"
          onClick={() => handleOrderTypeChange('delivery')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            orderType === 'delivery'
              ? 'bg-warm-600 text-white'
              : 'bg-warm-100 text-warm-500 hover:bg-warm-200'
          }`}
        >
          Delivery
        </button>
      </div>

      {/* Delivery address fields */}
      {orderType === 'delivery' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="street-address" className="text-warm-600 text-sm">
              Street Address
            </Label>
            <Input
              id="street-address"
              placeholder="123 Main St"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="border-warm-200 focus-visible:ring-warm-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city" className="text-warm-600 text-sm">
              City
            </Label>
            <Input
              id="city"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="border-warm-200 focus-visible:ring-warm-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="zip" className="text-warm-600 text-sm">
              Zip Code
            </Label>
            <Input
              id="zip"
              placeholder="12345"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              onBlur={(e) => validateZip(e.target.value)}
              className="border-warm-200 focus-visible:ring-warm-400"
            />
            {zipValidating && (
              <p className="text-xs text-warm-400">Checking delivery area...</p>
            )}
            {!zipValidating && deliveryFee !== null && (
              <p className="text-xs text-green-600 font-medium">
                Delivery fee: ${deliveryFee.toFixed(2)}
              </p>
            )}
            {!zipValidating && zipError && (
              <p className="text-xs text-red-500">{zipError}</p>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes" className="text-warm-600 text-sm">
          Special instructions (optional)
        </Label>
        <Textarea
          id="notes"
          placeholder="e.g. extra napkins, oat milk on the side…"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          className="border-warm-200 focus-visible:ring-warm-400 resize-none"
          rows={3}
        />
      </div>
    </div>
  )
}
