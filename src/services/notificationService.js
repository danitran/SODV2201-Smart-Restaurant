/**
 * notificationService.js — in-app notifications (the bell in the header).
 *
 * Each notification belongs to an "owner": a signed-in user's id, or the
 * guest id of this browser. `source` says who caused it:
 *   'customer'   the customer's own action (order placed, booking made)
 *   'restaurant' the restaurant's action (status changed, booking approved)
 * Pages only pop up a toast for 'restaurant' ones, because the customer
 * already sees a confirmation for their own actions.
 *
 * In a real deployment these would also be sent by email or SMS from the
 * back end; here they are stored with the rest of the data.
 */
import { updateDatabase } from './database.js'
import { simulateNetwork } from './network.js'
import { createId } from '../utils/ids.js'

const MAX_NOTIFICATIONS = 100

/** Adds a notification inside an updateDatabase() call (db is the open database). */
export function addNotification(db, { ownerId, title, message, link = '', source = 'customer' }) {
  if (!ownerId) return
  db.notifications.unshift({
    id: createId('ntf'),
    ownerId,
    title,
    message,
    link,
    source,
    read: false,
    createdAt: new Date().toISOString(),
  })
  db.notifications = db.notifications.slice(0, MAX_NOTIFICATIONS)
}

/** Marks every notification of one owner as read. */
export async function markAllNotificationsRead(ownerId) {
  await simulateNetwork(0)
  updateDatabase((db) => {
    db.notifications.forEach((notification) => {
      if (notification.ownerId === ownerId) notification.read = true
    })
  })
}
