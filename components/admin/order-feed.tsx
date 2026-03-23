'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order, OrderItem } from '@/lib/types'
import { OrderCard } from './order-card'

type OrderWithItems = Order & { order_items: OrderItem[] }

type FilterTab = 'all' | 'new' | 'preparing' | 'ready' | 'completed'

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',       label: 'All' },
  { id: 'new',       label: 'New' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'ready',     label: 'Ready' },
  { id: 'completed', label: 'Completed' },
]

function matchesFilter(order: OrderWithItems, tab: FilterTab): boolean {
  switch (tab) {
    case 'all':       return true
    case 'new':       return order.status === 'pending' || order.status === 'confirmed'
    case 'preparing': return order.status === 'preparing'
    case 'ready':     return order.status === 'ready' || order.status === 'out_for_delivery'
    case 'completed': return order.status === 'completed' || order.status === 'cancelled'
  }
}

function playNotificationSound() {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.4)
  } catch {
    // AudioContext not available — ignore
  }
}

function showBrowserNotification(order: OrderWithItems) {
  if (typeof window === 'undefined') return
  if (Notification.permission !== 'granted') return
  new Notification('New Order — The Happy Cup', {
    body: `${order.customer_name} placed a ${order.order_type} order`,
    icon: '/logo/1x/logo.png',
  })
}

export function OrderFeed() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    const supabase = createClient()

    // Initial fetch
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!mountedRef.current) return
        if (error) {
          console.error('Failed to fetch orders:', error)
        } else {
          setOrders((data as OrderWithItems[]) ?? [])
        }
        setLoading(false)
      })

    // Real-time subscription
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          if (!mountedRef.current) return
          // Fetch full order with items
          const { data: newOrder } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', (payload.new as Order).id)
            .single()

          if (!mountedRef.current || !newOrder) return
          const orderWithItems = newOrder as OrderWithItems
          setOrders((prev) => [orderWithItems, ...prev])
          playNotificationSound()
          showBrowserNotification(orderWithItems)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          if (!mountedRef.current) return
          const updated = payload.new as Order
          setOrders((prev) =>
            prev.map((o) =>
              o.id === updated.id ? { ...o, ...updated } : o
            )
          )
        }
      )
      .subscribe()

    return () => {
      mountedRef.current = false
      supabase.removeChannel(channel)
    }
  }, [])

  // Called by OrderCard after a successful status PATCH
  function handleStatusUpdate(orderId: string, newStatus: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o
      )
    )
  }

  const filtered = orders.filter((o) => matchesFilter(o, activeTab))

  const tabCounts: Record<FilterTab, number> = {
    all:       orders.length,
    new:       orders.filter((o) => matchesFilter(o, 'new')).length,
    preparing: orders.filter((o) => matchesFilter(o, 'preparing')).length,
    ready:     orders.filter((o) => matchesFilter(o, 'ready')).length,
    completed: orders.filter((o) => matchesFilter(o, 'completed')).length,
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-5 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === tab.id
                ? 'bg-warm-600 text-white'
                : 'bg-white text-warm-500 border border-warm-200 hover:bg-warm-100',
            ].join(' ')}
          >
            {tab.label}
            <span
              className={[
                'text-[11px] font-semibold rounded-full px-1.5 py-0',
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-warm-100 text-warm-500',
              ].join(' ')}
            >
              {tabCounts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Order list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-warm-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-warm-400">
          <p className="text-sm font-medium">No orders here</p>
          <p className="text-xs mt-1">New orders will appear in real time</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
