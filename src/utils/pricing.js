import { PRICING } from '../data/restaurantInfo.js'
import { roundMoney } from './format.js'

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

export function amountToFreeDelivery(subtotal) {
  return Math.max(0, roundMoney(PRICING.freeDeliveryOver - subtotal))
}
