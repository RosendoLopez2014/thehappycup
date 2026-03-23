'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CustomerAddress } from '@/lib/types'

interface AddressManagerProps {
  customerId: string
  initialAddresses: CustomerAddress[]
}

interface AddressFormData {
  label: string
  address_line: string
  city: string
  zip_code: string
  is_default: boolean
}

const emptyForm: AddressFormData = {
  label: '',
  address_line: '',
  city: '',
  zip_code: '',
  is_default: false,
}

export function AddressManager({ customerId, initialAddresses }: AddressManagerProps) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>(initialAddresses)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AddressFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function openNewForm() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
    setShowForm(true)
  }

  function openEditForm(address: CustomerAddress) {
    setEditingId(address.id)
    setForm({
      label: address.label,
      address_line: address.address_line,
      city: address.city,
      zip_code: address.zip_code,
      is_default: address.is_default,
    })
    setError(null)
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
  }

  function updateField<K extends keyof AddressFormData>(key: K, value: AddressFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    const trimmed = {
      label: form.label.trim(),
      address_line: form.address_line.trim(),
      city: form.city.trim(),
      zip_code: form.zip_code.trim(),
      is_default: form.is_default,
    }

    if (!trimmed.label || !trimmed.address_line || !trimmed.city || !trimmed.zip_code) {
      setError('All fields are required.')
      return
    }

    setSaving(true)
    setError(null)
    const supabase = createClient()

    try {
      if (editingId) {
        // If setting as default, unset others first
        if (trimmed.is_default) {
          await supabase
            .from('customer_addresses')
            .update({ is_default: false })
            .eq('customer_id', customerId)
            .neq('id', editingId)
        }

        const { data: updated, error: updateError } = await supabase
          .from('customer_addresses')
          .update(trimmed)
          .eq('id', editingId)
          .select()
          .single<CustomerAddress>()

        if (updateError) throw updateError

        setAddresses((prev) =>
          prev.map((a) => {
            if (a.id === editingId) return updated
            if (trimmed.is_default) return { ...a, is_default: false }
            return a
          })
        )
      } else {
        // If setting as default, unset others first
        if (trimmed.is_default) {
          await supabase
            .from('customer_addresses')
            .update({ is_default: false })
            .eq('customer_id', customerId)
        }

        const { data: inserted, error: insertError } = await supabase
          .from('customer_addresses')
          .insert({ ...trimmed, customer_id: customerId })
          .select()
          .single<CustomerAddress>()

        if (insertError) throw insertError

        setAddresses((prev) => {
          const updated = trimmed.is_default
            ? prev.map((a) => ({ ...a, is_default: false }))
            : [...prev]
          return [inserted, ...updated.filter((a) => a.id !== inserted.id)]
        })
      }

      cancelForm()
    } catch (err) {
      setError('Failed to save address. Please try again.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setConfirmDeleteId(null)
    const supabase = createClient()

    try {
      const { error: deleteError } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setAddresses((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      console.error('Failed to delete address:', err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Address list */}
      {addresses.length === 0 && !showForm && (
        <div className="bg-white border border-warm-200 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-4xl mb-4">📍</p>
          <p className="text-warm-700 font-medium mb-1">No saved addresses</p>
          <p className="text-sm text-warm-500 mb-4">Add a delivery address to save time at checkout.</p>
        </div>
      )}

      {addresses.map((address) => (
        <div
          key={address.id}
          className="bg-white border border-warm-200 rounded-2xl p-5 shadow-sm flex items-start justify-between gap-4"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-warm-800">{address.label}</p>
              {address.is_default && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-warm-600 text-white">
                  Default
                </span>
              )}
            </div>
            <p className="text-sm text-warm-600">{address.address_line}</p>
            <p className="text-sm text-warm-500">
              {address.city}, {address.zip_code}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditForm(address)}
              className="text-warm-500 hover:text-warm-700 hover:bg-warm-100 text-xs min-h-[44px] px-3"
            >
              Edit
            </Button>

            {confirmDeleteId === address.id ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(address.id)}
                  disabled={deletingId === address.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs min-h-[44px] px-3"
                >
                  {deletingId === address.id ? 'Deleting…' : 'Confirm'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDeleteId(null)}
                  className="text-warm-400 hover:text-warm-600 text-xs min-h-[44px] px-3"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDeleteId(address.id)}
                className="text-warm-400 hover:text-red-600 hover:bg-red-50 text-xs min-h-[44px] px-3"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      ))}

      {/* Add new address form */}
      {showForm && (
        <div className="bg-white border border-warm-300 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-warm-800">
            {editingId ? 'Edit Address' : 'New Address'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="addr-label" className="text-warm-700 text-sm">Label</Label>
              <Input
                id="addr-label"
                placeholder="Home, Work…"
                value={form.label}
                onChange={(e) => updateField('label', e.target.value)}
                className="border-warm-200 focus-visible:ring-warm-400"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="addr-line" className="text-warm-700 text-sm">Address</Label>
              <Input
                id="addr-line"
                placeholder="123 Main St"
                value={form.address_line}
                onChange={(e) => updateField('address_line', e.target.value)}
                className="border-warm-200 focus-visible:ring-warm-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="addr-city" className="text-warm-700 text-sm">City</Label>
              <Input
                id="addr-city"
                placeholder="City"
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                className="border-warm-200 focus-visible:ring-warm-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="addr-zip" className="text-warm-700 text-sm">ZIP Code</Label>
              <Input
                id="addr-zip"
                placeholder="12345"
                value={form.zip_code}
                onChange={(e) => updateField('zip_code', e.target.value)}
                className="border-warm-200 focus-visible:ring-warm-400"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => updateField('is_default', e.target.checked)}
              className="w-4 h-4 rounded border-warm-300 text-warm-600 focus:ring-warm-400"
            />
            <span className="text-sm text-warm-700">Set as default address</span>
          </label>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-warm-600 hover:bg-warm-700 text-white min-h-[48px] sm:min-h-[44px]"
            >
              {saving ? 'Saving…' : 'Save Address'}
            </Button>
            <Button
              variant="ghost"
              onClick={cancelForm}
              disabled={saving}
              className="text-warm-500 hover:text-warm-700 min-h-[44px]"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Add button (shown when form is hidden) */}
      {!showForm && (
        <Button
          onClick={openNewForm}
          className="bg-warm-600 hover:bg-warm-700 text-white w-full sm:w-auto min-h-[48px]"
        >
          + Add New Address
        </Button>
      )}
    </div>
  )
}
