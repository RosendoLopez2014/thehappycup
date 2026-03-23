'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { X, Plus, Loader2 } from 'lucide-react'
import type { MenuItem, ItemOption, MenuCategory } from '@/lib/types'

interface OptionEntry {
  name: string
  priceAdjustment: string
}

interface OptionGroup {
  group: string
  options: OptionEntry[]
}

interface MenuItemFormProps {
  item?: MenuItem & { item_options: ItemOption[] }
  categories: MenuCategory[]
  onSave: () => void
  onCancel: () => void
}

function buildInitialGroups(options: ItemOption[]): OptionGroup[] {
  const groupMap = new Map<string, OptionEntry[]>()

  for (const opt of options) {
    const existing = groupMap.get(opt.option_group) ?? []
    groupMap.set(opt.option_group, [
      ...existing,
      { name: opt.option_name, priceAdjustment: String(opt.price_adjustment) },
    ])
  }

  return Array.from(groupMap.entries()).map(([group, opts]) => ({ group, options: opts }))
}

export function MenuItemForm({ item, categories, onSave, onCancel }: MenuItemFormProps) {
  const isEdit = Boolean(item)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [price, setPrice] = useState(item ? String(item.price) : '')
  const [categoryId, setCategoryId] = useState(item?.category_id ?? '')
  const [imagePreview, setImagePreview] = useState<string | null>(item?.image_url ?? null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>(
    item?.item_options ? buildInitialGroups(item.item_options) : []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
  }

  function addOptionGroup() {
    setOptionGroups((prev) => [...prev, { group: '', options: [{ name: '', priceAdjustment: '0' }] }])
  }

  function removeOptionGroup(groupIdx: number) {
    setOptionGroups((prev) => prev.filter((_, i) => i !== groupIdx))
  }

  function updateGroupName(groupIdx: number, value: string) {
    setOptionGroups((prev) =>
      prev.map((g, i) => (i === groupIdx ? { ...g, group: value } : g))
    )
  }

  function addOption(groupIdx: number) {
    setOptionGroups((prev) =>
      prev.map((g, i) =>
        i === groupIdx
          ? { ...g, options: [...g.options, { name: '', priceAdjustment: '0' }] }
          : g
      )
    )
  }

  function removeOption(groupIdx: number, optIdx: number) {
    setOptionGroups((prev) =>
      prev.map((g, i) =>
        i === groupIdx
          ? { ...g, options: g.options.filter((_, j) => j !== optIdx) }
          : g
      )
    )
  }

  function updateOption(groupIdx: number, optIdx: number, field: keyof OptionEntry, value: string) {
    setOptionGroups((prev) =>
      prev.map((g, i) =>
        i === groupIdx
          ? {
              ...g,
              options: g.options.map((o, j) =>
                j === optIdx ? { ...o, [field]: value } : o
              ),
            }
          : g
      )
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) { setError('Name is required'); return }
    if (!price || isNaN(Number(price))) { setError('Valid price is required'); return }
    if (!categoryId) { setError('Category is required'); return }

    setLoading(true)

    try {
      let imageUrl = item?.image_url ?? null

      // Upload image if a new file was selected
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)

        const uploadRes = await fetch('/api/admin/menu/upload', {
          method: 'POST',
          body: formData,
        })
        const uploadJson = await uploadRes.json()

        if (!uploadRes.ok) {
          setError(uploadJson.error ?? 'Image upload failed')
          setLoading(false)
          return
        }

        imageUrl = uploadJson.url
      }

      // Flatten option groups into the options array
      const options = optionGroups.flatMap((g) =>
        g.options
          .filter((o) => o.name.trim())
          .map((o) => ({
            group: g.group,
            name: o.name,
            priceAdjustment: Number(o.priceAdjustment) || 0,
          }))
      )

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        categoryId,
        imageUrl,
        options,
      }

      const url = isEdit ? `/api/admin/menu/${item!.id}` : '/api/admin/menu'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Failed to save item')
        setLoading(false)
        return
      }

      onSave()
    } catch (err) {
      console.error('MenuItemForm submit error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="item-name">Name</Label>
        <Input
          id="item-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Caramel Latte"
          disabled={loading}
          required
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="item-description">Description</Label>
        <Textarea
          id="item-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description (optional)"
          rows={2}
          disabled={loading}
        />
      </div>

      {/* Price & Category */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="item-price">Price ($)</Label>
          <Input
            id="item-price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            disabled={loading}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? '')} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Image upload */}
      <div className="flex flex-col gap-1.5">
        <Label>Image</Label>
        <div className="flex items-start gap-3">
          {imagePreview && (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-warm-200 flex-shrink-0">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="object-cover"
                unoptimized={imagePreview.startsWith('blob:')}
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              {imagePreview ? 'Change image' : 'Upload image'}
            </Button>
            <p className="text-xs text-warm-400">JPEG, PNG, or WebP · max 5 MB</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={loading}
        />
      </div>

      <Separator />

      {/* Option groups */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-warm-600">Option Groups</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOptionGroup}
            disabled={loading}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Option Group
          </Button>
        </div>

        {optionGroups.length === 0 && (
          <p className="text-xs text-warm-400">No option groups. Add one to let customers customize this item.</p>
        )}

        {optionGroups.map((group, gIdx) => (
          <div key={gIdx} className="rounded-lg border border-warm-200 p-3 flex flex-col gap-3">
            {/* Group name row */}
            <div className="flex items-center gap-2">
              <Input
                value={group.group}
                onChange={(e) => updateGroupName(gIdx, e.target.value)}
                placeholder="Group name (e.g. Size, Milk)"
                disabled={loading}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeOptionGroup(gIdx)}
                disabled={loading}
                className="text-warm-400 hover:text-red-500 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2 pl-1">
              {group.options.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <Input
                    value={opt.name}
                    onChange={(e) => updateOption(gIdx, oIdx, 'name', e.target.value)}
                    placeholder="Option name"
                    disabled={loading}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={opt.priceAdjustment}
                    onChange={(e) => updateOption(gIdx, oIdx, 'priceAdjustment', e.target.value)}
                    placeholder="+0.00"
                    disabled={loading}
                    className="w-24"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(gIdx, oIdx)}
                    disabled={loading}
                    className="text-warm-400 hover:text-red-500 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addOption(gIdx)}
                disabled={loading}
                className="self-start text-warm-500 h-7 px-2"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add option
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEdit ? 'Save changes' : 'Create item'}
        </Button>
      </div>
    </form>
  )
}
