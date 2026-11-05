import { useCallback, useEffect, useMemo, useState } from 'react'
import { RestaurantContext } from './RestaurantContext.js'
import { loadDatabase, resetDatabase, subscribeToDatabase } from '../services/database.js'
import * as menuService from '../services/menuService.js'
import * as orderService from '../services/orderService.js'
import * as reservationService from '../services/reservationService.js'
import { markAllNotificationsRead } from '../services/notificationService.js'
import { simulateNetwork } from '../services/network.js'

export function RestaurantProvider({ children }) {
  const [db, setDb] = useState(loadDatabase)

  useEffect(() => subscribeToDatabase(setDb), [])

  const run = useCallback(async (serviceCall) => {
    try {
      return await serviceCall()
    } finally {
      setDb(loadDatabase())
    }
  }, [])

  const actions = useMemo(
    () => ({
      placeOrder: (input) => run(() => orderService.placeOrder(input)),
      updateOrderStatus: (id, status) => run(() => orderService.updateOrderStatus(id, status)),
      submitFeedback: (orderId, feedback) => run(() => orderService.submitFeedback(orderId, feedback)),
      createReservation: (input, owner) => run(() => reservationService.createReservation(input, owner)),
      updateReservationStatus: (id, status, by) => run(() => reservationService.updateReservationStatus(id, status, by)),
      createMenuItem: (input) => run(() => menuService.createMenuItem(input)),
      updateMenuItem: (id, input) => run(() => menuService.updateMenuItem(id, input)),
      deleteMenuItem: (id) => run(() => menuService.deleteMenuItem(id)),
      setItemAvailability: (id, available) => run(() => menuService.setItemAvailability(id, available)),
      setTodaysSpecial: (id) => run(() => menuService.setTodaysSpecial(id)),
      markAllNotificationsRead: (ownerId) => run(() => markAllNotificationsRead(ownerId)),
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
