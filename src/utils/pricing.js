/**
 * pricing.js — the one place where the bill is calculated.
 *
 * The cart page, the checkout page and the order service all call
 * calculateTotals(), so the customer always sees the same numbers that get
 * saved on the order.
 *
 *   subtotal     = Σ price × quantity
 *   delivery fee = $4.99 for delivery orders under $50, otherwise $0
 *   tax (GST)    = 5% of (subtotal + delivery fee)
 *   total        = subtotal + delivery fee + tax
 */
import { PRICING } from '../data/restaurantInfo.js'
import { roundMoney } from './format.js'

/**
 * @param {{price:number, quantity:number}[]} lines  cart or order lines
 * @param {'delivery'|'pickup'} orderType
 */
export function calculateTotals(lines, orderType = 'pickup') {
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.price * line.quantity, 0))

  const needsDeliveryFee =
    orderType === 'delivery' && subtotal > 0 && subtotal < PRICING.freeDeliveryOver
  const deliveryFee = needsDeliveryFee ? PRICING.deliveryFee : 0

  const tax = roundMoney((subtotal + deliveryFee) * PRICING.taxRate)
  const total = roundMoney(subtotal + deliveryFee + tax)

  return { itemCount, subtotal, deliveryFee, tax, total }
}

/** How much more the customer must add to unlock free delivery (0 if already free). */
export function amountToFreeDelivery(subtotal) {
  return Math.max(0, roundMoney(PRICING.freeDeliveryOver - subtotal))
}
