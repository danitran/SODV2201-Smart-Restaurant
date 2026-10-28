/**
 * restaurantInfo.js — fixed facts and business rules for the restaurant.
 *
 * Keeping these values in one file means a rule (tax rate, delivery fee,
 * reservation limits…) is changed in exactly one place, and every page,
 * service and test reads the same number.
 */

export const RESTAURANT = {
  name: 'Basil & Brick',
  tagline: 'Wood-fired Italian kitchen in Calgary',
  address: '1208 Brickyard Lane SW, Calgary, AB',
  phone: '(403) 555-0148',
  hoursLabel: 'Open daily, 11 am to 10 pm',
}

/** Money rules used by the cart, checkout and order service. */
export const PRICING = {
  taxRate: 0.05, // Alberta: 5% GST only
  deliveryFee: 4.99,
  freeDeliveryOver: 50, // subtotal at which delivery becomes free
  minDeliverySubtotal: 15, // smallest order we deliver
  maxQuantityPerItem: 20,
}

/** Menu categories in the order they appear on the menu. */
export const CATEGORIES = [
  { id: 'starters', label: 'Starters' },
  { id: 'mains', label: 'Mains' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'beverages', label: 'Beverages' },
]

/** Dietary tags a dish can have (used by filters, badges and the AI). */
export const DIETARY_TAGS = [
  { id: 'vegetarian', label: 'Vegetarian', short: 'V' },
  { id: 'vegan', label: 'Vegan', short: 'VG' },
  { id: 'gluten-free', label: 'Gluten-free', short: 'GF' },
  { id: 'dairy-free', label: 'Dairy-free', short: 'DF' },
]

/** Order statuses in the order the kitchen moves through them. */
export const ORDER_FLOW = ['pending', 'preparing', 'ready', 'delivered']

/** Which status an order may move to next (used by the admin buttons). */
export const NEXT_ORDER_STATUS = {
  pending: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered'],
  delivered: [],
  cancelled: [],
}

/** Reservation rules shared by the booking form and the service. */
export const RESERVATION_RULES = {
  firstSlot: '11:00',
  lastSlot: '21:00',
  slotMinutes: 30,
  maxDaysAhead: 60,
  seatsPerSlot: 40, // total guests the dining room can seat per time slot
  table: { min: 1, max: 12 },
  event: { min: 10, max: 60 },
}

export const EVENT_TYPES = [
  { id: 'birthday', label: 'Birthday party' },
  { id: 'corporate', label: 'Corporate gathering' },
  { id: 'anniversary', label: 'Anniversary' },
  { id: 'other', label: 'Other celebration' },
]

/** Demo accounts shown on the sign-in page so the app is easy to test. */
export const DEMO_ACCOUNTS = {
  customer: { email: 'customer@demo.com', password: 'demo123' },
  admin: { email: 'admin@demo.com', password: 'admin123' },
}
