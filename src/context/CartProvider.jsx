import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartContext } from './CartContext.js'
import { useRestaurant } from './RestaurantContext.js'
import { readJSON, writeJSON } from '../services/storage.js'
import { PRICING } from '../data/restaurantInfo.js'

const CART_KEY = 'basil-brick:cart'
const ORDER_TYPE_KEY = 'basil-brick:order-type'
const clamp = (quantity) => Math.min(PRICING.maxQuantityPerItem, Math.max(0, Math.round(quantity)))

export function CartProvider({ children }) {
  const { menu } = useRestaurant()
  // Only ids and quantities are stored; names, prices and availability come from the live menu.
  const [entries, setEntries] = useState(() => {
    const saved = readJSON(CART_KEY, [])
    return Array.isArray(saved) ? saved : []
  })

  const [orderType, setOrderType] = useState(() =>
    readJSON(ORDER_TYPE_KEY, 'delivery') === 'pickup' ? 'pickup' : 'delivery',
  )

  useEffect(() => {
    try {
      writeJSON(CART_KEY, entries)
      writeJSON(ORDER_TYPE_KEY, orderType)
    } catch {
      // Storage disabled: the cart still works until the page closes.
    }
  }, [entries, orderType])

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
      orderType,
      setOrderType,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [lines, entries, orderType, addItem, updateQuantity, removeItem, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
