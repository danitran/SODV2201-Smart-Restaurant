/**
 * seed.js — builds the starting "database" the first time the app runs.
 *
 * It creates:
 *   - the menu (from menuItems.js)
 *   - two demo accounts (a customer and an admin)
 *   - about four weeks of past orders, so the admin charts and the AI's
 *     "popular items" answers have real data to work with
 *   - a few orders that are in progress right now (for the kitchen board)
 *   - reservations, event requests and customer feedback
 *
 * A seeded random generator (mulberry32) is used instead of Math.random(),
 * so every reset produces the same data. Dates are relative to "now", so the
 * charts always show the last 7 days, whatever day the app is opened.
 */
import { MENU_ITEMS } from './menuItems.js'
import { DEMO_ACCOUNTS } from './restaurantInfo.js'
import { addDays, toDateInputValue } from '../utils/format.js'
import { hashPassword } from '../utils/ids.js'
import { calculateTotals } from '../utils/pricing.js'

export const DEMO_CUSTOMER_ID = 'u-demo'
export const ADMIN_ID = 'u-admin'
const SEED_OWNER = 'guest-seed' // owner of the sample guest orders

/** Small deterministic random number generator: returns numbers in [0, 1). */
function mulberry32(seed) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Picks a value using weights, e.g. [['a', 3], ['b', 1]] → 'a' 75% of the time. */
function weightedPick(random, entries) {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = random() * total
  for (const [value, weight] of entries) {
    roll -= weight
    if (roll < 0) return value
  }
  return entries.at(-1)[0]
}

// How often each dish appears in sample orders (higher = more popular).
const WEIGHTS = {
  starters: [['garden-salad', 25], ['garlic-bread', 25], ['caesar-salad', 20], ['bruschetta', 15], ['calamari', 10], ['tomato-soup', 10]],
  mains: [['chicken-alfredo', 30], ['margherita-pizza', 18], ['vegetable-pasta', 12], ['diavola-pizza', 12], ['grilled-salmon', 10], ['gf-penne-bolognese', 8], ['ribeye-steak', 8]],
  desserts: [['lava-cake', 45], ['tiramisu', 25], ['strawberry-cheesecake', 18], ['mango-sorbet', 12]],
  beverages: [['lemonade', 30], ['cappuccino', 25], ['peach-iced-tea', 20], ['blood-orange-soda', 15], ['sparkling-water', 10]],
}

const GUESTS = [
  'Priya Shah', 'Marcus Lee', 'Sofia Rossi', 'Daniel Okafor', 'Emma Wilson', 'Noah Tremblay',
  'Ava Nguyen', 'Liam Fraser', 'Chloe Martin', 'Ethan Brown', 'Mia Johnson', 'Lucas Garcia',
  'Zoe Campbell', 'Owen Patel', 'Grace Kim', 'Hannah Dubois',
]

const ADDRESSES = [
  '14 Elbow Dr SW, Calgary', '302 Kensington Rd NW, Calgary', '88 Riverstone Pl SE, Calgary',
  '1520 17 Ave SW, Calgary', '9 Aspen Ridge Way SW, Calgary', '411 Bridgeland Ave NE, Calgary',
  '27 Mission Rd SW, Calgary', '650 Inglewood Ln SE, Calgary',
]

const FEEDBACK_SAMPLES = [
  { rating: 5, comment: 'The Chicken Alfredo was rich and creamy. Delicious!' },
  { rating: 5, comment: 'Pizza crust was perfect, you can taste the wood fire.' },
  { rating: 4, comment: 'Fast delivery and the food was still hot.' },
  { rating: 5, comment: 'Lava cake was amazing, gooey in the middle.' },
  { rating: 3, comment: 'Food was good but delivery was slow.' },
  { rating: 5, comment: 'Friendly staff at pickup and everything was fresh.' },
  { rating: 4, comment: 'Great portions for the price.' },
  { rating: 2, comment: 'Delivery arrived late and the pizza was cold.' },
  { rating: 5, comment: 'Best tiramisu in Calgary. Will order again.' },
  { rating: 4, comment: 'Loved the vegetable pasta, very fresh.' },
  { rating: 5, comment: 'Ordering online was quick and easy.' },
  { rating: 3, comment: 'Pasta was a bit salty this time.' },
  { rating: 4, comment: 'Excellent salmon, cooked perfectly.' },
  { rating: 5, comment: 'Delicious food and friendly service as always.' },
  { rating: 2, comment: 'Order was missing the garlic bread.' },
  { rating: 4, comment: 'Tasty Margherita, would like a bit more basil.' },
  { rating: 5, comment: 'Amazing Alfredo, my go-to comfort food.' },
  { rating: 3, comment: 'Tasty, but the wait for pickup was longer than quoted.' },
  { rating: 5, comment: 'Fresh ingredients and fast delivery.' },
  { rating: 4, comment: 'Good value and the staff were helpful on the phone.' },
  { rating: 5, comment: 'The calamari was crispy and perfectly seasoned.' },
]

/** Timestamps for each status an order passed through, starting at createdAt. */
function buildHistory(createdAt, finalStatus) {
  const start = new Date(createdAt).getTime()
  const minutesAfter = { pending: 0, preparing: 3, ready: 19, delivered: 42, cancelled: 6 }
  const path = finalStatus === 'cancelled' ? ['pending', 'cancelled'] : ['pending', 'preparing', 'ready', 'delivered']
  const stop = path.indexOf(finalStatus)
  return path.slice(0, stop + 1).map((status) => ({
    status,
    at: new Date(start + minutesAfter[status] * 60_000).toISOString(),
  }))
}

export function createSeedDatabase(now = new Date()) {
  const random = mulberry32(2201)
  const pick = (list) => list[Math.floor(random() * list.length)]

  const menu = MENU_ITEMS.map((item) => ({
    ...item,
    ingredients: [...item.ingredients],
    dietary: [...item.dietary],
    available: true,
    isSpecial: Boolean(item.isSpecial),
    spicy: Boolean(item.spicy),
  }))
  const menuById = new Map(menu.map((item) => [item.id, item]))

  const users = [
    {
      id: ADMIN_ID,
      name: 'Restaurant Admin',
      email: DEMO_ACCOUNTS.admin.email,
      phone: '403-555-0100',
      address: '',
      role: 'admin',
      passwordHash: hashPassword(DEMO_ACCOUNTS.admin.password),
      preferences: { dietary: [] },
      createdAt: addDays(now, -120).toISOString(),
    },
    {
      id: DEMO_CUSTOMER_ID,
      name: 'Alex Morgan',
      email: DEMO_ACCOUNTS.customer.email,
      phone: '403-555-0123',
      address: '45 Maple Crescent SW, Calgary',
      role: 'customer',
      passwordHash: hashPassword(DEMO_ACCOUNTS.customer.password),
      preferences: { dietary: [] },
      createdAt: addDays(now, -60).toISOString(),
    },
  ]
  const demoCustomer = users[1]

  // ── Helper to build one order object ────────────────────────────────────
  const drafts = []
  const makeDraft = ({ createdAt, lines, type, status, customer, ownerId = SEED_OWNER, userId = null }) => {
    const items = lines.map(([itemId, quantity]) => {
      const item = menuById.get(itemId)
      return { itemId, name: item.name, emoji: item.emoji, price: item.price, quantity }
    })
    const totals = calculateTotals(items, type)
    drafts.push({
      ownerId,
      userId,
      customer: { ...customer, address: type === 'delivery' ? customer.address : '' },
      type,
      items,
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      tax: totals.tax,
      total: totals.total,
      notes: '',
      status,
      statusHistory: buildHistory(createdAt, status),
      createdAt,
      feedbackId: null,
    })
  }

  const randomGuest = () => {
    const name = pick(GUESTS)
    const [first, last] = name.toLowerCase().split(' ')
    return {
      name,
      phone: `403-555-01${String(Math.floor(random() * 90) + 10)}`,
      email: `${first}.${last}@example.com`,
      address: pick(ADDRESSES),
    }
  }

  const randomLines = () => {
    const lines = new Map()
    const add = (category, quantity = 1) => {
      const id = weightedPick(random, WEIGHTS[category])
      lines.set(id, (lines.get(id) ?? 0) + quantity)
    }
    add('mains', random() < 0.85 ? 1 : 2)
    if (random() < 0.3) add('mains')
    if (random() < 0.5) add('starters')
    if (random() < 0.45) add('desserts')
    const drinks = random() < 0.4 ? 0 : random() < 0.66 ? 1 : 2
    for (let i = 0; i < drinks; i += 1) add('beverages')
    return [...lines.entries()]
  }

  const atTime = (date, minutesFromMidnight) => {
    const copy = new Date(date)
    copy.setHours(0, 0, 0, 0)
    copy.setMinutes(minutesFromMidnight)
    return copy
  }

  // ── Past 27 days of guest orders ────────────────────────────────────────
  for (let daysAgo = 27; daysAgo >= 1; daysAgo -= 1) {
    const day = addDays(now, -daysAgo)
    const weekend = day.getDay() === 0 || day.getDay() === 5 || day.getDay() === 6
    const count = 3 + Math.floor(random() * 3) + (weekend ? 2 : 0)
    for (let i = 0; i < count; i += 1) {
      const createdAt = atTime(day, 690 + Math.floor(random() * 600)).toISOString() // 11:30 to 21:30
      makeDraft({
        createdAt,
        lines: randomLines(),
        type: random() < 0.6 ? 'delivery' : 'pickup',
        status: random() < 0.05 ? 'cancelled' : 'delivered',
        customer: randomGuest(),
      })
    }
  }

  // ── Today: a few finished orders, then orders still in the kitchen ──────
  const earliestToday = atTime(now, 690).getTime()
  const latestFinished = now.getTime() - 2 * 3_600_000
  if (latestFinished > earliestToday) {
    for (let i = 0; i < 3; i += 1) {
      const createdAt = new Date(earliestToday + random() * (latestFinished - earliestToday)).toISOString()
      makeDraft({ createdAt, lines: randomLines(), type: random() < 0.6 ? 'delivery' : 'pickup', status: 'delivered', customer: randomGuest() })
    }
  }
  const inKitchen = [
    { minutesAgo: 75, status: 'ready', type: 'pickup' },
    { minutesAgo: 41, status: 'preparing', type: 'delivery' },
    { minutesAgo: 22, status: 'preparing', type: 'pickup' },
    { minutesAgo: 8, status: 'pending', type: 'delivery' },
    { minutesAgo: 3, status: 'pending', type: 'pickup' },
  ]
  for (const entry of inKitchen) {
    makeDraft({
      createdAt: new Date(now.getTime() - entry.minutesAgo * 60_000).toISOString(),
      lines: randomLines(),
      type: entry.type,
      status: entry.status,
      customer: randomGuest(),
    })
  }

  // ── The demo customer's own history (newest = Alfredo + Lava Cake) ──────
  const demoContact = {
    name: demoCustomer.name,
    phone: demoCustomer.phone,
    email: demoCustomer.email,
    address: demoCustomer.address,
  }
  const demoOrders = [
    { daysAgo: 9, minutes: 1120, lines: [['margherita-pizza', 1], ['lemonade', 1]], type: 'pickup' },
    { daysAgo: 5, minutes: 1150, lines: [['grilled-salmon', 1], ['tiramisu', 1]], type: 'delivery' },
    { daysAgo: 2, minutes: 1100, lines: [['chicken-alfredo', 1], ['lava-cake', 1]], type: 'delivery' },
  ]
  for (const order of demoOrders) {
    makeDraft({
      createdAt: atTime(addDays(now, -order.daysAgo), order.minutes).toISOString(),
      lines: order.lines,
      type: order.type,
      status: 'delivered',
      customer: demoContact,
      ownerId: DEMO_CUSTOMER_ID,
      userId: DEMO_CUSTOMER_ID,
    })
  }

  // Give orders readable, increasing numbers in time order: ORD-1001, ORD-1002, …
  drafts.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const orders = drafts.map((draft, index) => ({ id: `ORD-${1001 + index}`, ...draft }))

  // ── Feedback on some delivered orders ───────────────────────────────────
  const feedback = []
  const addFeedback = (order, { rating, comment }) => {
    const entry = {
      id: `fb-${feedback.length + 1}`,
      orderId: order.id,
      userId: order.userId,
      name: order.customer.name,
      rating,
      comment,
      createdAt: new Date(new Date(order.statusHistory.at(-1).at).getTime() + 3_600_000).toISOString(),
    }
    feedback.push(entry)
    order.feedbackId = entry.id
  }
  const guestDelivered = orders.filter((order) => order.status === 'delivered' && order.ownerId === SEED_OWNER)
  FEEDBACK_SAMPLES.forEach((sample, index) => {
    const order = guestDelivered[(index * 5 + 2) % guestDelivered.length]
    if (order && !order.feedbackId) addFeedback(order, sample)
  })
  const salmonOrder = orders.find((order) => order.userId === DEMO_CUSTOMER_ID && order.items[0].itemId === 'grilled-salmon')
  addFeedback(salmonOrder, { rating: 5, comment: 'The salmon was perfectly cooked and delivery was quick.' })

  // ── Reservations and event requests ─────────────────────────────────────
  const dateIn = (days) => toDateInputValue(addDays(now, days))
  const guestContact = (name) => {
    const [first, last] = name.toLowerCase().split(' ')
    return { name, email: `${first}.${last}@example.com`, phone: `403-555-02${String(name.length + 10)}` }
  }
  const reservationDrafts = [
    { days: 3, time: '19:00', partySize: 2, type: 'table', status: 'confirmed', owner: 'demo' },
    { days: 1, time: '18:30', partySize: 4, type: 'table', status: 'confirmed', name: 'Priya Shah' },
    { days: 6, time: '18:00', partySize: 16, type: 'event', eventType: 'birthday', status: 'pending', name: 'Marcus Lee', specialRequests: 'Birthday cake at 7 pm, please. One guest is vegan.' },
    { days: 9, time: '12:00', partySize: 30, type: 'event', eventType: 'corporate', status: 'pending', name: 'Sofia Rossi', specialRequests: 'Team lunch for Northwind Consulting. A projector would help.' },
    { days: 0, time: '21:00', partySize: 6, type: 'table', status: 'confirmed', name: 'Daniel Okafor' },
    { days: 2, time: '20:00', partySize: 3, type: 'table', status: 'cancelled', name: 'Emma Wilson' },
    { days: 14, time: '19:00', partySize: 12, type: 'event', eventType: 'anniversary', status: 'confirmed', name: 'Noah Tremblay', specialRequests: '25th anniversary dinner. Quiet corner if possible.' },
    { days: -3, time: '19:00', partySize: 4, type: 'table', status: 'confirmed', name: 'Ava Nguyen' },
  ]
  const reservations = reservationDrafts.map((draft, index) => {
    const isDemo = draft.owner === 'demo'
    const contact = isDemo ? { name: demoCustomer.name, email: demoCustomer.email, phone: demoCustomer.phone } : guestContact(draft.name)
    const createdAt = addDays(now, Math.min(draft.days, 0) - 4).toISOString()
    return {
      id: `RES-${2001 + index}`,
      ownerId: isDemo ? DEMO_CUSTOMER_ID : SEED_OWNER,
      userId: isDemo ? DEMO_CUSTOMER_ID : null,
      ...contact,
      date: dateIn(draft.days),
      time: draft.time,
      partySize: draft.partySize,
      type: draft.type,
      eventType: draft.eventType ?? '',
      specialRequests: draft.specialRequests ?? '',
      status: draft.status,
      createdAt,
      updatedAt: createdAt,
    }
  })

  return {
    version: 1,
    seededAt: now.toISOString(),
    menu,
    users,
    orders,
    reservations,
    feedback,
    notifications: [],
    counters: { order: 1000 + orders.length, reservation: 2000 + reservations.length },
  }
}
