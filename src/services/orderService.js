import { ApiError } from './apiError.js'
import { updateDatabase } from './database.js'
import { simulateNetwork } from './network.js'
import { addNotification } from './notificationService.js'
import { NEXT_ORDER_STATUS, PRICING, RESTAURANT } from '../data/restaurantInfo.js'
import { calculateTotals } from '../utils/pricing.js'
import { createId } from '../utils/ids.js'
import { hasErrors, validateCheckout, validateFeedback } from '../utils/validation.js'

export function getStatusLabel(status, type = 'delivery') {
  const labels = {
    pending: 'Order received',
    preparing: 'Preparing',
    ready: type === 'pickup' ? 'Ready for pickup' : 'On the way',
    delivered: type === 'pickup' ? 'Picked up' : 'Delivered',
    cancelled: 'Cancelled',
  }
  return labels[status] ?? status
}

const STATUS_MESSAGES = {
  preparing: (order) => `The kitchen is preparing order ${order.id}.`,
  ready: (order) =>
    order.type === 'pickup'
      ? `Order ${order.id} is ready for pickup at ${RESTAURANT.address}.`
      : `Order ${order.id} is ready and on its way to you.`,
  delivered: (order) =>
    order.type === 'pickup' ? `Order ${order.id} was picked up. Enjoy your meal!` : `Order ${order.id} was delivered. Enjoy your meal!`,
  cancelled: (order) => `Order ${order.id} was cancelled by the restaurant. Call ${RESTAURANT.phone} if you have questions.`,
}

export async function placeOrder({ ownerId, userId = null, customer, type, items, notes = '' }) {
  await simulateNetwork()
  return updateDatabase((db) => {
    if (!items?.length) throw new ApiError('Your order is empty. Add something from the menu first.')

    // Prices come from the current menu, never from the cart.
    const lines = items.map(({ itemId, quantity }) => {
      const item = db.menu.find((menuItem) => menuItem.id === itemId)
      if (!item) throw new ApiError('An item in your order is no longer on the menu. Remove it and try again.')
      if (!item.available) throw new ApiError(`${item.name} just sold out. Remove it from your order to continue.`)
      const qty = Number(quantity)
      if (!Number.isInteger(qty) || qty < 1 || qty > PRICING.maxQuantityPerItem) {
        throw new ApiError(`Quantity for ${item.name} must be between 1 and ${PRICING.maxQuantityPerItem}.`)
      }
      return { itemId, name: item.name, price: item.price, quantity: qty }
    })

    const totals = calculateTotals(lines, type)
    const errors = validateCheckout({ ...customer, type, notes }, { subtotal: totals.subtotal })
    if (hasErrors(errors)) throw new ApiError('Please fix the highlighted fields.', errors)

    db.counters.order += 1
    const now = new Date().toISOString()
    const order = {
      id: `ORD-${db.counters.order}`,
      ownerId,
      userId,
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email.trim(),
        address: type === 'delivery' ? customer.address.trim() : '',
      },
      type,
      items: lines,
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      tax: totals.tax,
      total: totals.total,
      notes: notes.trim(),
      status: 'pending',
      statusHistory: [{ status: 'pending', at: now }],
      createdAt: now,
      feedbackId: null,
    }
    db.orders.push(order)

    addNotification(db, {
      ownerId,
      title: 'Order confirmed',
      message: `We received order ${order.id}. We will update you as it moves through the kitchen.`,
      link: `/orders/${order.id}`,
      source: 'customer',
    })
    return order
  })
}

export async function updateOrderStatus(orderId, nextStatus) {
  await simulateNetwork(150)
  return updateDatabase((db) => {
    const order = db.orders.find((candidate) => candidate.id === orderId)
    if (!order) throw new ApiError(`Order ${orderId} was not found.`)
    if (!NEXT_ORDER_STATUS[order.status]?.includes(nextStatus)) {
      throw new ApiError(
        `Order ${orderId} is already "${getStatusLabel(order.status, order.type)}", so it cannot change to "${getStatusLabel(nextStatus, order.type)}". Another admin may have updated it.`,
      )
    }
    order.status = nextStatus
    order.statusHistory.push({ status: nextStatus, at: new Date().toISOString() })

    addNotification(db, {
      ownerId: order.ownerId,
      title: getStatusLabel(nextStatus, order.type),
      message: STATUS_MESSAGES[nextStatus](order),
      link: `/orders/${order.id}`,
      source: 'restaurant',
    })
    return order
  })
}

export async function submitFeedback(orderId, { rating, comment = '' }) {
  await simulateNetwork()
  return updateDatabase((db) => {
    const order = db.orders.find((candidate) => candidate.id === orderId)
    if (!order) throw new ApiError(`Order ${orderId} was not found.`)
    if (order.status !== 'delivered') throw new ApiError('You can rate an order after it has been delivered or picked up.')
    if (order.feedbackId) throw new ApiError('You already rated this order. Thank you!')

    const errors = validateFeedback({ rating: Number(rating), comment })
    if (hasErrors(errors)) throw new ApiError('Please fix the highlighted fields.', errors)

    const entry = {
      id: createId('fb'),
      orderId,
      userId: order.userId,
      name: order.customer.name,
      rating: Number(rating),
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    }
    db.feedback.push(entry)
    order.feedbackId = entry.id
    return entry
  })
}
