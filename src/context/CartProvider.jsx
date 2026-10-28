/**
 * CartProvider.jsx — the shopping cart.
 *
 * The cart only stores { itemId, quantity }. Names, prices and availability
 * are looked up in the live menu every render, so if an admin changes a price
 * or marks a dish sold out, the cart shows it straight away.
 * The cart is saved in localStorage so it survives a page refresh.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartContext } from './CartContext.js'
import { useRestaurant } from './RestaurantContext.js'
import { readJSON, writeJSON } from '../services/storage.js'
import { PRICING } from '../data/restaurantInfo.js'

const CART_KEY = 'basil-brick:cart'
const clamp = (quantity) => Math.min(PRICING.maxQuantityPerItem, Math.max(0, Math.round(quantity)))

export function CartProvider({ children }) {
  const { menu } = useRestaurant()
  const [entries, setEntries] = useState(() => {
    const saved = readJSON(CART_KEY, [])
    return Array.isArray(saved) ? saved : []
  })

  // Save the cart whenever it changes.
  useEffect(() => {
    try {
      writeJSON(CART_KEY, entries)
    } catch {
      // The cart still works for this visit even if it cannot be saved.
    }
  }, [entries])

  const addItem = useCallback((itemId, quantity = 1) => {
    setEntries((current) => {
      const existing = current.find((entry) => entry.itemId === itemId)
      if (existing) {
        return current.map((entry) =>
          entry.itemId === itemId ? { ...entry, quantity: clamp(entry.quantity + quantity) } : entry,
        )
      }
      return [...current, { itemId, quantity: clamp(quantity) }]
    })
  }, [])

  const updateQuantity = useCallback((itemId, quantity) => {
    setEntries((current) =>
      clamp(quantity) === 0
        ? current.filter((entry) => entry.itemId !== itemId)
        : current.map((entry) => (entry.itemId === itemId ? { ...entry, quantity: clamp(quantity) } : entry)),
    )
  }, [])

  const removeItem = useCallback((itemId) => {
    setEntries((current) => current.filter((entry) => entry.itemId !== itemId))
  }, [])

  const clearCart = useCallback(() => setEntries([]), [])

  // Join each cart entry with the current menu item.
  const lines = useMemo(
    () =>
      entries.map((entry) => {
        const item = menu.find((menuItem) => menuItem.id === entry.itemId)
        return {
          itemId: entry.itemId,
          quantity: entry.quantity,
          item,
          name: item?.name ?? 'Item no longer on the menu',
          emoji: item?.emoji ?? '🍽️',
          price: item?.price ?? 0,
          isOrderable: Boolean(item?.available),
        }
      }),
    [entries, menu],
  )

  const value = useMemo(
    () => ({
      lines,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      blockedLines: lines.filter((line) => !line.isOrderable),
      getQuantity: (itemId) => entries.find((entry) => entry.itemId === itemId)?.quantity ?? 0,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [lines, entries, addItem, updateQuantity, removeItem, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
