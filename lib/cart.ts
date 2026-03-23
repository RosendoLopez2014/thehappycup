import type { CartItem } from '@/lib/types'

export type { CartItem }

const CART_KEY = 'thehappycup_cart'

// Sort keys for order-independent comparison
function normalizeOptions(
  options: Record<string, { name: string; priceAdjustment: number }>
): string {
  const sorted = Object.keys(options)
    .sort()
    .reduce<Record<string, { name: string; priceAdjustment: number }>>((acc, key) => {
      acc[key] = options[key]
      return acc
    }, {})
  return JSON.stringify(sorted)
}

function isSameItem(
  a: CartItem,
  b: { menuItemId: string; selectedOptions: Record<string, { name: string; priceAdjustment: number }> }
): boolean {
  return (
    a.menuItemId === b.menuItemId &&
    normalizeOptions(a.selectedOptions) === normalizeOptions(b.selectedOptions)
  )
}

// localStorage helpers

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CartItem[]
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  } catch {
    // Quota exceeded or private browsing — silently ignore
  }
}

export function clearCart(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CART_KEY)
}

// Pure cart operations

export function addToCart(items: CartItem[], item: CartItem): CartItem[] {
  const index = items.findIndex((i) => isSameItem(i, item))
  if (index === -1) {
    return [...items, item]
  }
  return items.map((i, idx) => {
    if (idx !== index) return i
    const newQuantity = i.quantity + item.quantity
    return { ...i, quantity: newQuantity, lineTotal: i.price * newQuantity }
  })
}

export function removeFromCart(
  items: CartItem[],
  menuItemId: string,
  selectedOptions: Record<string, { name: string; priceAdjustment: number }>
): CartItem[] {
  return items.filter((i) => !isSameItem(i, { menuItemId, selectedOptions }))
}

export function updateQuantity(
  items: CartItem[],
  menuItemId: string,
  selectedOptions: Record<string, { name: string; priceAdjustment: number }>,
  quantity: number
): CartItem[] {
  if (quantity <= 0) {
    return removeFromCart(items, menuItemId, selectedOptions)
  }
  return items.map((i) => {
    if (!isSameItem(i, { menuItemId, selectedOptions })) return i
    return { ...i, quantity, lineTotal: i.price * quantity }
  })
}

export function getCartTotal(items: CartItem[]): { subtotal: number; itemCount: number } {
  return items.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + item.lineTotal,
      itemCount: acc.itemCount + item.quantity,
    }),
    { subtotal: 0, itemCount: 0 }
  )
}
