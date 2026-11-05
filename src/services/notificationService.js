import { updateDatabase } from './database.js'
import { simulateNetwork } from './network.js'
import { createId } from '../utils/ids.js'

const MAX_NOTIFICATIONS = 100

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

export async function markAllNotificationsRead(ownerId) {
  await simulateNetwork(0)
  updateDatabase((db) => {
    db.notifications.forEach((notification) => {
      if (notification.ownerId === ownerId) notification.read = true
    })
  })
}
