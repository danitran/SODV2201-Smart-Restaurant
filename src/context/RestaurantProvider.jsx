/**
 * RestaurantProvider.jsx — the shared data store for the whole app.
 *
 * - `db` state holds a copy of the database loaded from localStorage.
 * - Every action calls a service (which validates and saves), then reloads
 *   `db` so all components re-render with the new data.
 * - useEffect subscribes to changes made in OTHER browser tabs, which is what
 *   makes the customer and admin screens update in real time.
 *
 * Components never touch localStorage directly; they use useRestaurant().
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { RestaurantContext } from './RestaurantContext.js'
import { loadDatabase, resetDatabase, subscribeToDatabase } from '../services/database.js'
import * as menuService from '../services/menuService.js'
import * as orderService from '../services/orderService.js'
import * as reservationService from '../services/reservationService.js'
import { markAllNotificationsRead } from '../services/notificationService.js'
import { simulateNetwork } from '../services/network.js'

export function RestaurantProvider({ children }) {
  // Lazy initial state: loadDatabase runs once, not on every render.
  const [db, setDb] = useState(loadDatabase)

  // Real-time sync with other tabs. The returned function unsubscribes on unmount.
  useEffect(() => subscribeToDatabase(setDb), [])

  /** Runs a service call, then reloads the data (even if the call failed). */
  const run = useCallback(async (serviceCall) => {
    try {
      return await serviceCall()
    } finally {
      setDb(loadDatabase())
    }
  }, [])

  const actions = useMemo(
    () => ({
      // Orders
      placeOrder: (input) => run(() => orderService.placeOrder(input)),
      updateOrderStatus: (id, status) => run(() => orderService.updateOrderStatus(id, status)),
      submitFeedback: (orderId, feedback) => run(() => orderService.submitFeedback(orderId, feedback)),
      // Reservations
      createReservation: (input, owner) => run(() => reservationService.createReservation(input, owner)),
      updateReservationStatus: (id, status, by) => run(() => reservationService.updateReservationStatus(id, status, by)),
      // Menu (admin)
      createMenuItem: (input) => run(() => menuService.createMenuItem(input)),
      updateMenuItem: (id, input) => run(() => menuService.updateMenuItem(id, input)),
      deleteMenuItem: (id) => run(() => menuService.deleteMenuItem(id)),
      setItemAvailability: (id, available) => run(() => menuService.setItemAvailability(id, available)),
      setTodaysSpecial: (id) => run(() => menuService.setTodaysSpecial(id)),
      // Notifications
      markAllNotificationsRead: (ownerId) => run(() => markAllNotificationsRead(ownerId)),
      // Demo helper for the video: put the original sample data back.
      resetDemoData: () =>
        run(async () => {
          await simulateNetwork()
          resetDatabase()
        }),
    }),
    [run],
  )

  const value = useMemo(
    () => ({
      menu: db.menu,
      orders: db.orders,
      reservations: db.reservations,
      feedback: db.feedback,
      notifications: db.notifications,
      ...actions,
    }),
    [db, actions],
  )

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>
}
