import { createContext, useContext } from 'react'

export const RestaurantContext = createContext(null)

export function useRestaurant() {
  const context = useContext(RestaurantContext)
  if (!context) throw new Error('useRestaurant() must be used inside <RestaurantProvider>.')
  return context
}
