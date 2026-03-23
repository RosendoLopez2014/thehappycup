'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { CartItem } from '@/lib/types'
import {
  getCart,
  saveCart,
  addToCart,
  removeFromCart,
  updateQuantity as updateQty,
  clearCart as clearStorage,
  getCartTotal,
} from '@/lib/cart'

interface CartContextValue {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (menuItemId: string, selectedOptions: CartItem['selectedOptions']) => void
  updateQuantity: (
    menuItemId: string,
    selectedOptions: CartItem['selectedOptions'],
    quantity: number
  ) => void
  clearCart: () => void
  itemCount: number
  subtotal: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Hydrate from localStorage on mount
  useEffect(() => {
    setItems(getCart())
  }, [])

  // Persist to localStorage whenever items change
  useEffect(() => {
    saveCart(items)
  }, [items])

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => addToCart(prev, item))
  }, [])

  const removeItem = useCallback(
    (menuItemId: string, selectedOptions: CartItem['selectedOptions']) => {
      setItems((prev) => removeFromCart(prev, menuItemId, selectedOptions))
    },
    []
  )

  const updateQuantity = useCallback(
    (menuItemId: string, selectedOptions: CartItem['selectedOptions'], quantity: number) => {
      setItems((prev) => updateQty(prev, menuItemId, selectedOptions, quantity))
    },
    []
  )

  const clearCart = useCallback(() => {
    clearStorage()
    setItems([])
  }, [])

  const { subtotal, itemCount } = getCartTotal(items)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return ctx
}
