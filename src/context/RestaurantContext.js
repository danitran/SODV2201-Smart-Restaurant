/**
 * RestaurantContext.js — context object + hook for the restaurant's data
 * (menu, orders, reservations, feedback, notifications) and the actions that
 * change it. The provider is in RestaurantProvider.jsx.
 *
 *   const { menu, placeOrder } = useRestaurant()
 */
import { createContext, useContext } from 'react'

export const RestaurantContext = createContext(null)

export function useRestaurant() {
  const context = useContext(RestaurantContext)
  if (!context) throw new Error('useRestaurant() must be used inside <RestaurantProvider>.')
  return context
}
