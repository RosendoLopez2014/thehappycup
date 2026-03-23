'use client'

import { useState } from 'react'
import type { Order, OrderItem } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

type OrderWithItems = Order & { order_items: OrderItem[] }

interface OrderCardProps {
  order: OrderWithItems
  onStatusUpdate: (orderId: string, newStatus: string) => void
}

// Maps current status → next button label + next status value
const pickupNextAction: Record<string, { label: string; nextStatus: string } | null> = {
  pending:   { label: 'Confirm',        nextStatus: 'confirmed' },
  confirmed: { label: 'Start Preparing', nextStatus: 'preparing' },
  preparing: { label: 'Mark Ready',     nextStatus: 'ready' },
  ready:     { label: 'Complete',       nextStatus: 'completed' },
  completed: null,
  cancelled: null,
  out_for_delivery: null,
}

const deliveryNextAction: Record<string, { label: string; nextStatus: string } | null> = {
  pending:          { label: 'Confirm',          nextStatus: 'confirmed' },
  confirmed:        { label: 'Start Preparing',   nextStatus: 'preparing' },
  preparing:        { label: 'Mark Ready',        nextStatus: 'ready' },
  ready:            { label: 'Out for Delivery',  nextStatus: 'out_for_delivery' },
  out_for_delivery: { label: 'Complete',          nextStatus: 'completed' },
  completed: null,
  cancelled: null,
}

const statusColors: Record<string, string> = {
  pending:          'bg-yellow-100 text-yellow-800',
  confirmed:        'bg-blue-100 text-blue-800',
  preparing:        'bg-orange-100 text-orange-800',
  ready:            'bg-emerald-100 text-emerald-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  completed:        'bg-gray-100 text-gray-600',
  cancelled:        'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  pending:          'Pending',
  confirmed:        'Confirmed',
  preparing:        'Preparing',
  ready:            'Ready',
  out_for_delivery: 'Out for Delivery',
  completed:        'Completed',
  cancelled:        'Cancelled',
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)  return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) === 1 ? '' : 's'} ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function OrderCard({ order, onStatusUpdate }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)

  const nextAction =
    order.order_type === 'pickup'
      ? pickupNextAction[order.status]
      : deliveryNextAction[order.status]

  async function handleAdvanceStatus() {
    if (!nextAction) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextAction.nextStatus }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('Status update failed:', err)
        return
      }
      onStatusUpdate(order.id, nextAction.nextStatus)
    } catch (err) {
      console.error('Status update error:', err)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        {/* Order type + payment badges */}
        <div className="flex flex-col gap-1.5 shrink-0 pt-0.5">
          <span
            className={[
              'text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide',
              order.order_type === 'pickup'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-emerald-100 text-emerald-700',
            ].join(' ')}
          >
            {order.order_type === 'pickup' ? 'Pickup' : 'Delivery'}
          </span>
          <span
            className={[
              'text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide',
              order.payment_status === 'paid'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700',
            ].join(' ')}
          >
            {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-warm-600 text-sm truncate">{order.customer_name}</h3>
            <span className="text-xs text-warm-400 shrink-0">{timeAgo(order.created_at)}</span>
          </div>

          {/* Items summary */}
          <ul className="mt-1 space-y-0.5">
            {order.order_items.map((item) => (
              <li key={item.id} className="text-xs text-warm-500">
                {item.quantity}× {item.item_name}
                {Object.keys(item.selected_options).length > 0 && (
                  <span className="text-warm-400">
                    {' '}(
                    {Object.values(item.selected_options)
                      .map((o) => o.name)
                      .join(', ')}
                    )
                  </span>
                )}
              </li>
            ))}
          </ul>

          {/* Status + total */}
          <div className="flex items-center gap-2 mt-2">
            <span
              className={[
                'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                statusColors[order.status] ?? 'bg-gray-100 text-gray-600',
              ].join(' ')}
            >
              {statusLabels[order.status] ?? order.status}
            </span>
            <span className="text-xs font-medium text-warm-600 ml-auto">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Expandable details */}
      {expanded && (
        <div className="border-t border-warm-100 px-4 py-3 bg-warm-50 space-y-1.5 text-xs text-warm-500">
          {order.customer_email && (
            <p><span className="font-medium text-warm-600">Email:</span> {order.customer_email}</p>
          )}
          {order.customer_phone && (
            <p><span className="font-medium text-warm-600">Phone:</span> {order.customer_phone}</p>
          )}
          {order.delivery_address && (
            <p>
              <span className="font-medium text-warm-600">Address:</span>{' '}
              {order.delivery_address}
              {order.delivery_zip ? `, ${order.delivery_zip}` : ''}
            </p>
          )}
          {order.notes && (
            <p><span className="font-medium text-warm-600">Notes:</span> {order.notes}</p>
          )}
          <div className="flex gap-4 pt-1">
            <span>Subtotal: {formatCurrency(order.subtotal)}</span>
            {order.discount > 0 && <span>Discount: -{formatCurrency(order.discount)}</span>}
            {order.delivery_fee > 0 && <span>Delivery: {formatCurrency(order.delivery_fee)}</span>}
          </div>
          <p className="text-[11px] font-mono text-warm-400">#{order.id.slice(0, 8)}</p>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-warm-100 bg-white">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-warm-400 hover:text-warm-600 transition-colors min-h-[44px] px-1"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Less</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Details</>
          )}
        </button>

        {nextAction && (
          <Button
            size="sm"
            onClick={handleAdvanceStatus}
            disabled={updating}
            className="ml-auto bg-warm-600 hover:bg-warm-700 text-white text-xs h-9 px-4 min-h-[44px]"
          >
            {updating ? (
              <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Updating…</>
            ) : (
              nextAction.label
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
