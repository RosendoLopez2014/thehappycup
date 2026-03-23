'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { MenuItem, ItemOption, MenuCategory } from '@/lib/types'

type MenuItemWithOptions = MenuItem & {
  item_options: ItemOption[]
  menu_categories: MenuCategory | null
}

interface GroupedItems {
  category: MenuCategory
  items: MenuItemWithOptions[]
}

interface MenuListProps {
  onEdit: (item: MenuItemWithOptions) => void
  refreshKey: number
}

interface SortableItemRowProps {
  item: MenuItemWithOptions
  onToggleAvailability: (id: string, current: boolean) => void
  onEdit: (item: MenuItemWithOptions) => void
  onDelete: (id: string) => void
}

function SortableItemRow({ item, onToggleAvailability, onEdit, onDelete }: SortableItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 bg-white border-b border-warm-100 last:border-b-0 hover:bg-warm-50 transition-colors"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-warm-300 hover:text-warm-500 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        aria-label="Drag to reorder"
        type="button"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Name + sold out badge */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-warm-700 truncate">{item.name}</span>
          {!item.is_available && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-warm-100 text-warm-500">
              Sold Out
            </Badge>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-warm-400 truncate mt-0.5">{item.description}</p>
        )}
      </div>

      {/* Price */}
      <span className="font-mono text-sm text-warm-600 flex-shrink-0">
        ${item.price.toFixed(2)}
      </span>

      {/* Availability toggle */}
      <Switch
        checked={item.is_available}
        onCheckedChange={() => onToggleAvailability(item.id, item.is_available)}
        aria-label={`Toggle availability for ${item.name}`}
        className="flex-shrink-0"
      />

      {/* Edit */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(item)}
        className="flex-shrink-0 text-warm-400 hover:text-warm-700"
        aria-label={`Edit ${item.name}`}
      >
        <Pencil className="w-4 h-4" />
      </Button>

      {/* Delete */}
      <Button
        variant="ghost"
        size="icon"
        className="flex-shrink-0 text-warm-400 hover:text-red-500"
        aria-label={`Delete ${item.name}`}
        onClick={() => {
          if (window.confirm(`Delete "${item.name}"? This cannot be undone.`)) {
            onDelete(item.id)
          }
        }}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}

export function MenuList({ onEdit, refreshKey }: MenuListProps) {
  const [groups, setGroups] = useState<GroupedItems[]>([])
  const [loading, setLoading] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/menu')
      const json = await res.json()

      if (!res.ok) {
        console.error('Failed to fetch menu items:', json.error)
        return
      }

      const items: MenuItemWithOptions[] = json.data ?? []

      // Group by category
      const categoryMap = new Map<string, GroupedItems>()
      for (const item of items) {
        const cat = item.menu_categories
        if (!cat) continue
        if (!categoryMap.has(cat.id)) {
          categoryMap.set(cat.id, { category: cat, items: [] })
        }
        categoryMap.get(cat.id)!.items.push(item)
      }

      // Sort categories by display_order (already sorted from API, but preserve)
      const grouped = Array.from(categoryMap.values()).sort(
        (a, b) => a.category.display_order - b.category.display_order
      )

      setGroups(grouped)
    } catch (err) {
      console.error('MenuList fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems, refreshKey])

  async function handleToggleAvailability(id: string, current: boolean) {
    // Optimistic update
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        items: g.items.map((item) =>
          item.id === id ? { ...item, is_available: !current } : item
        ),
      }))
    )

    try {
      const res = await fetch(`/api/admin/menu/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !current }),
      })

      if (!res.ok) {
        // Revert on failure
        setGroups((prev) =>
          prev.map((g) => ({
            ...g,
            items: g.items.map((item) =>
              item.id === id ? { ...item, is_available: current } : item
            ),
          }))
        )
      }
    } catch {
      // Revert on error
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          items: g.items.map((item) =>
            item.id === id ? { ...item, is_available: current } : item
          ),
        }))
      )
    }
  }

  async function handleDelete(id: string) {
    // Optimistic update
    setGroups((prev) =>
      prev
        .map((g) => ({ ...g, items: g.items.filter((item) => item.id !== id) }))
        .filter((g) => g.items.length > 0)
    )

    try {
      const res = await fetch(`/api/admin/menu/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        // Refresh to restore actual state
        fetchItems()
      }
    } catch {
      fetchItems()
    }
  }

  async function handleDragEnd(event: DragEndEvent, categoryId: string) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setGroups((prev) =>
      prev.map((g) => {
        if (g.category.id !== categoryId) return g

        const oldIndex = g.items.findIndex((item) => item.id === active.id)
        const newIndex = g.items.findIndex((item) => item.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return g

        const reordered = arrayMove(g.items, oldIndex, newIndex)

        // Persist new display_order in the background
        reordered.forEach((item, idx) => {
          if (item.display_order !== idx) {
            fetch(`/api/admin/menu/${item.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ display_order: idx }),
            }).catch((err) => console.error('Failed to update display_order:', err))
          }
        })

        return { ...g, items: reordered.map((item, idx) => ({ ...item, display_order: idx })) }
      })
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-warm-200 overflow-hidden">
            <div className="h-10 bg-warm-100 animate-pulse" />
            <div className="flex flex-col gap-0">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-14 bg-white border-b border-warm-100 animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-16 text-warm-400">
        <p className="text-sm font-medium">No menu items yet</p>
        <p className="text-xs mt-1">Click &ldquo;Add New Item&rdquo; to get started</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.category.id} className="rounded-xl border border-warm-200 overflow-hidden">
          {/* Category heading */}
          <div className="px-4 py-2.5 bg-warm-50 border-b border-warm-200">
            <h2 className="text-xs font-semibold text-warm-500 uppercase tracking-wider">
              {group.category.name}
            </h2>
          </div>

          {/* Sortable items */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(event, group.category.id)}
          >
            <SortableContext
              items={group.items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {group.items.map((item) => (
                <SortableItemRow
                  key={item.id}
                  item={item}
                  onToggleAvailability={handleToggleAvailability}
                  onEdit={onEdit}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      ))}
    </div>
  )
}
