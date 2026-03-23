'use client'

import { useState } from 'react'
import type { Order, OrderItem, OrderStatus } from '@/lib/types'

interface OrderCardProps {
  order: Order
  items: OrderItem[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function statusBadge(status: OrderStatus) {
  const configs: Record<OrderStatus, { label: string; className: string }> = {
    pending:          { label: 'Pending',          className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    confirmed:        { label: 'Confirmed',         className: 'bg-blue-100 text-blue-700 border-blue-200' },
    preparing:        { label: 'Preparing',         className: 'bg-blue-100 text-blue-700 border-blue-200' },
    ready:            { label: 'Ready',             className: 'bg-green-100 text-green-700 border-green-200' },
    out_for_delivery: { label: 'Out for Delivery',  className: 'bg-blue-100 text-blue-700 border-blue-200' },
    completed:        { label: 'Completed',         className: 'bg-warm-100 text-warm-500 border-warm-200' },
    cancelled:        { label: 'Cancelled',         className: 'bg-red-100 text-red-600 border-red-200' },
  }
  const cfg = configs[status] ?? { label: status, className: 'bg-warm-100 text-warm-500 border-warm-200' }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

function orderTypeBadge(type: string) {
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-warm-50 text-warm-600 border-warm-200">
      {type === 'delivery' ? 'Delivery' : 'Pickup'}
    </span>
  )
}

function itemOptionsSummary(options: Record<string, { name: string; priceAdjustment: number }>) {
  return Object.values(options)
    .map((o) => o.name)
    .join(', ')
}

export function OrderCard({ order, items }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false)

  const itemsSummary = items.map((i) => i.item_name).join(', ')

  return (
    <div className="bg-white border border-warm-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Summary row */}
      <button
        className="w-full text-left px-5 py-4 flex flex-col gap-2 hover:bg-warm-50 transition-colors"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {statusBadge(order.status)}
            {orderTypeBadge(order.order_type)}
          </div>
          <span className="text-xs text-warm-400">{formatDate(order.created_at)}</span>
        </div>

        <p className="text-sm text-warm-700 line-clamp-1">
          {itemsSummary || 'No items'}
        </p>

        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-semibold text-warm-800">
            {formatCurrency(order.total)}
          </span>
          <span className="text-xs text-warm-400">
            {expanded ? 'Hide details ▲' : 'View details ▼'}
          </span>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-warm-100 px-5 py-4 flex flex-col gap-4 bg-warm-50/40">

          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-warm-600 uppercase tracking-wide mb-2">Items</p>
            <ul className="flex flex-col gap-2">
              {items.map((item) => {
                const optionsSummary = itemOptionsSummary(item.selected_options ?? {})
                return (
                  <li key={item.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-warm-800 font-medium">
                        {item.quantity}× {item.item_name}
                      </p>
                      {optionsSummary && (
                        <p className="text-xs text-warm-400">{optionsSummary}</p>
                      )}
                    </div>
                    <span className="font-mono text-sm text-warm-700 shrink-0">
                      {formatCurrency(item.line_total)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Totals */}
          <div className="border-t border-warm-100 pt-3 flex flex-col gap-1 text-sm">
            <div className="flex justify-between text-warm-600">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-warm-600">
                <span>Delivery fee</span>
                <span className="font-mono">{formatCurrency(order.delivery_fee)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span className="font-mono">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-warm-800 border-t border-warm-100 pt-2 mt-1">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Delivery address */}
          {order.order_type === 'delivery' && order.delivery_address && (
            <div>
              <p className="text-xs font-semibold text-warm-600 uppercase tracking-wide mb-1">
                Delivery Address
              </p>
              <p className="text-sm text-warm-700">
                {order.delivery_address}
                {order.delivery_zip && `, ${order.delivery_zip}`}
              </p>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div>
              <p className="text-xs font-semibold text-warm-600 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-warm-600 italic">{order.notes}</p>
            </div>
          )}

          {/* Points */}
          {(order.points_earned > 0 || order.points_redeemed > 0) && (
            <div className="flex gap-4 text-xs text-warm-500">
              {order.points_earned > 0 && (
                <span className="text-green-600 font-medium">+{order.points_earned} pts earned</span>
              )}
              {order.points_redeemed > 0 && (
                <span className="text-red-500 font-medium">-{order.points_redeemed} pts redeemed</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
