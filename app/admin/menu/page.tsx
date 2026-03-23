'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { MenuList } from '@/components/admin/menu-list'
import { MenuItemForm } from '@/components/admin/menu-item-form'
import type { MenuItem, ItemOption, MenuCategory } from '@/lib/types'

type MenuItemWithOptions = MenuItem & {
  item_options: ItemOption[]
  menu_categories: MenuCategory | null
}

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItemWithOptions | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/menu')
      if (res.ok) {
        const json = await res.json()
        const items: MenuItemWithOptions[] = json.data ?? []
        // Deduplicate categories from items, preserving order
        const seen = new Set<string>()
        const cats: MenuCategory[] = []
        for (const item of items) {
          if (item.menu_categories && !seen.has(item.menu_categories.id)) {
            seen.add(item.menu_categories.id)
            cats.push(item.menu_categories)
          }
        }
        setCategories(cats)
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  function handleEdit(item: MenuItemWithOptions) {
    setEditingItem(item)
    setDialogOpen(true)
  }

  function handleOpenNew() {
    setEditingItem(null)
    setDialogOpen(true)
  }

  function handleSave() {
    setDialogOpen(false)
    setEditingItem(null)
    setRefreshKey((k) => k + 1)
  }

  function handleCancel() {
    setDialogOpen(false)
    setEditingItem(null)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-warm-600">Menu</h1>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          if (!open) handleCancel()
          else setDialogOpen(true)
        }}>
          <DialogTrigger render={
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Add New Item
            </Button>
          } onClick={handleOpenNew} />
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? `Edit "${editingItem.name}"` : 'New Menu Item'}
              </DialogTitle>
            </DialogHeader>
            <MenuItemForm
              item={editingItem ?? undefined}
              categories={categories}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </DialogContent>
        </Dialog>
      </div>

      <MenuList onEdit={handleEdit} refreshKey={refreshKey} />
    </div>
  )
}
