export const RESTAURANT = {
  name: 'Basil & Brick',
  tagline: 'Wood-fired Italian kitchen in Calgary',
  address: '1208 Brickyard Lane SW, Calgary, AB',
  phone: '(403) 555-0148',
  hoursLabel: 'Open daily, 11 am to 10 pm',
}

export const PRICING = {
  taxRate: 0.05,
  deliveryFee: 4.99,
  freeDeliveryOver: 50,
  minDeliverySubtotal: 15,
  maxQuantityPerItem: 20,
}

export const CATEGORIES = [
  { id: 'starters', label: 'Starters' },
  { id: 'mains', label: 'Mains' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'beverages', label: 'Beverages' },
]

export const DIETARY_TAGS = [
  { id: 'vegetarian', label: 'Vegetarian', short: 'V' },
  { id: 'vegan', label: 'Vegan', short: 'VG' },
  { id: 'gluten-free', label: 'Gluten-free', short: 'GF' },
  { id: 'dairy-free', label: 'Dairy-free', short: 'DF' },
]

export const ORDER_FLOW = ['pending', 'preparing', 'ready', 'delivered']

export const NEXT_ORDER_STATUS = {
  pending: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered'],
  delivered: [],
  cancelled: [],
}

export const RESERVATION_RULES = {
  firstSlot: '11:00',
  lastSlot: '21:00',
  slotMinutes: 30,
  maxDaysAhead: 60,
  seatsPerSlot: 40,
  table: { min: 1, max: 12 },
  event: { min: 10, max: 60 },
}

export const EVENT_TYPES = [
  { id: 'birthday', label: 'Birthday party' },
  { id: 'corporate', label: 'Corporate gathering' },
  { id: 'anniversary', label: 'Anniversary' },
  { id: 'other', label: 'Other celebration' },
]

export const DEMO_ACCOUNTS = {
  customer: { email: 'customer@demo.com', password: 'demo123' },
  admin: { email: 'admin@demo.com', password: 'admin123' },
}
