/**
 * aiService.js — the simulated AI assistant (Assignment 1, AI Option 2).
 *
 * How a reply is produced:
 *   1. normalize()      lower-case the message and strip punctuation
 *   2. detectIntent()   score every intent by the keywords it contains
 *                       (a phrase of N words = N points); `priority` breaks ties
 *   3. RESPONDERS[id]   build the answer. Most answers use live data:
 *                       the menu (today's special, dietary tags), all orders
 *                       (what is popular) and the customer's own orders
 *                       (last order, personal suggestions).
 *
 * Everything runs in the browser, so no API key is needed. To switch to a real
 * model later (Gemini, Groq or Ollama), only getAssistantReply() changes: it
 * would send the message plus this same context to the Node.js back end.
 *
 * All functions here are pure (no React, no storage), which makes them easy to
 * unit test: see aiService.test.js.
 */
import { BRIEF_DATASET, EXTRA_INTENTS } from '../data/aiDataset.js'
import { CATEGORIES, DIETARY_TAGS, PRICING, RESERVATION_RULES, RESTAURANT } from '../data/restaurantInfo.js'
import { getPopularItems } from '../utils/analytics.js'
import { formatPrice, joinWithAnd } from '../utils/format.js'
import { getStatusLabel } from './orderService.js'

const ALL_INTENTS = [...BRIEF_DATASET, ...EXTRA_INTENTS]
const briefResponse = (id) => BRIEF_DATASET.find((entry) => entry.id === id).response

// When a question mixes "recommend" with a specific topic ("what dessert do you
// recommend?"), the topic gives the more useful answer.
const TOPIC_INTENTS = ['popular-dessert', 'vegetarian', 'gluten-free', 'vegan', 'dairy-free']

/** "Do you have GLUTEN-FREE options?!" → "do you have gluten free options" */
export function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Returns { id, score } of the best matching intent, or null if nothing matches. */
export function detectIntent(message) {
  const text = ` ${normalize(message)} `
  const scored = ALL_INTENTS.map((intent, index) => {
    const score = intent.keywords.reduce((total, keyword) => {
      const phrase = normalize(keyword)
      return text.includes(` ${phrase} `) ? total + phrase.split(' ').length : total
    }, 0)
    return { id: intent.id, score, priority: intent.priority ?? 0, index }
  }).filter((entry) => entry.score > 0)

  if (scored.length === 0) return null
  scored.sort((a, b) => b.score - a.score || b.priority - a.priority || a.index - b.index)

  const best = scored[0]
  if (best.id === 'recommend') {
    const topic = scored.find((entry) => TOPIC_INTENTS.includes(entry.id))
    if (topic) return { id: topic.id, score: topic.score }
  }
  return { id: best.id, score: best.score }
}

// ── Helpers that read the live data ──────────────────────────────────────

/** Orders that belong to the person chatting (account first, then this device). */
function getMyOrders({ orders, user, ownerId }) {
  return orders
    .filter((order) => (user ? order.userId === user.id : order.ownerId === ownerId))
    .filter((order) => order.status !== 'cancelled')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

const matchesDiets = (item, diets) => diets.every((diet) => item.dietary.includes(diet))
const dietLabel = (diets) =>
  joinWithAnd(diets.map((diet) => DIETARY_TAGS.find((tag) => tag.id === diet)?.label.toLowerCase() ?? diet))
const existingIds = (menu, ids) => ids.filter((id) => menu.some((item) => item.id === id))

/** A dish the customer has not tried yet, from the category they order most. */
function suggestSomethingNew(context, diets) {
  const myOrders = getMyOrders(context)
  if (myOrders.length === 0) return null

  const tried = new Set(myOrders.flatMap((order) => order.items.map((line) => line.itemId)))
  const perCategory = new Map()
  for (const order of myOrders) {
    for (const line of order.items) {
      const item = context.menu.find((menuItem) => menuItem.id === line.itemId)
      if (item && item.category !== 'beverages') {
        perCategory.set(item.category, (perCategory.get(item.category) ?? 0) + line.quantity)
      }
    }
  }
  const favourite = [...perCategory.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  if (!favourite) return null

  const pick = getPopularItems(context.orders, context.menu, { category: favourite, limit: 20 }).find(
    (item) => !tried.has(item.id) && item.available && matchesDiets(item, diets),
  )
  if (!pick) return null
  const label = CATEGORIES.find((category) => category.id === favourite)?.label.toLowerCase()
  return { item: pick, text: `Since you often order our ${label}, you might also like the ${pick.name}.` }
}

/** Lists dishes with a dietary tag (starters and mains first). */
function listDietDishes(menu, diet) {
  return menu
    .filter((item) => item.available && item.dietary.includes(diet) && item.category !== 'beverages')
    .sort((a, b) => (a.category === 'mains' ? -1 : 0) - (b.category === 'mains' ? -1 : 0))
}

// ── One function per intent: returns { text, itemIds?, link? } ───────────

const RESPONDERS = {
  'todays-special': ({ menu, orders }) => {
    const special = menu.find((item) => item.isSpecial)
    if (special && special.available) {
      return { text: `Today's special is ${special.name} for ${formatPrice(special.price)}.`, itemIds: [special.id] }
    }
    const backup = getPopularItems(orders, menu, { category: 'mains', limit: 10 }).find((item) => item.available)
    const opening = special ? `Today's special, ${special.name}, just sold out.` : 'We do not have a special today.'
    return backup
      ? { text: `${opening} Our most ordered main right now is the ${backup.name} (${formatPrice(backup.price)}).`, itemIds: [backup.id] }
      : { text: opening }
  },

  vegetarian: ({ menu }) => ({
    text: briefResponse('vegetarian'),
    itemIds: existingIds(menu, BRIEF_DATASET.find((entry) => entry.id === 'vegetarian').itemIds),
    link: { to: '/menu?diet=vegetarian', label: 'See all vegetarian dishes' },
  }),

  recommend: (context) => {
    const diets = context.user?.preferences?.dietary ?? []
    const popularMains = getPopularItems(context.orders, context.menu, { category: 'mains', limit: 20 }).filter(
      (item) => item.available,
    )
    const top = popularMains.find((item) => matchesDiets(item, diets)) ?? popularMains[0]
    if (!top) return { text: 'Everything is popular today! Have a look at the menu.', link: { to: '/menu', label: 'Open the menu' } }

    const usedPreferences = diets.length > 0 && matchesDiets(top, diets)
    const sentences = [
      usedPreferences
        ? `Based on popular orders and your ${dietLabel(diets)} preference, we recommend our ${top.name}.`
        : `Based on popular orders, we recommend our ${top.name}.`,
    ]
    const itemIds = [top.id]
    const personal = suggestSomethingNew(context, diets)
    if (personal && personal.item.id !== top.id) {
      sentences.push(personal.text)
      itemIds.push(personal.item.id)
    }
    return { text: sentences.join(' '), itemIds }
  },

  'gluten-free': ({ menu }) => ({
    text: briefResponse('gluten-free'),
    itemIds: existingIds(menu, BRIEF_DATASET.find((entry) => entry.id === 'gluten-free').itemIds),
    link: BRIEF_DATASET.find((entry) => entry.id === 'gluten-free').link,
  }),

  'popular-dessert': ({ menu, orders }) => {
    const top = getPopularItems(orders, menu, { category: 'desserts', limit: 1 })[0]
    if (!top) return { text: 'All our desserts are made in house. Have a look at the dessert menu!', link: { to: '/menu?category=desserts', label: 'See desserts' } }
    return { text: `Our ${top.name} is our most popular dessert.`, itemIds: [top.id] }
  },

  'last-order': (context) => {
    const [last] = getMyOrders(context)
    if (!last) {
      return context.user
        ? { text: 'I cannot find any orders on your account yet. Your first order will show up here.', link: { to: '/menu', label: 'Start an order' } }
        : { text: 'I do not see a previous order on this device. Sign in to see the orders on your account.', link: { to: '/login', label: 'Sign in' } }
    }
    const names = [...new Set(last.items.map((line) => line.name))]
    return {
      text: `Your previous order was ${joinWithAnd(names)}.`,
      itemIds: existingIds(context.menu, last.items.map((line) => line.itemId)),
      link: { to: `/orders/${last.id}`, label: `View order ${last.id}` },
    }
  },

  greeting: ({ user }) => ({
    text: `Hi${user ? ` ${user.name.split(' ')[0]}` : ''}! I am the ${RESTAURANT.name} assistant. Ask me about today's special, vegetarian or gluten-free dishes, or what you ordered last time.`,
  }),

  thanks: () => ({ text: 'You are welcome! Enjoy your meal.' }),

  hours: () => ({
    text: `We are open every day from 11 am to 10 pm. Tables can be booked from 11:00 AM to 9:00 PM.`,
    link: { to: '/reservations', label: 'Book a table' },
  }),

  location: () => ({ text: `You can find us at ${RESTAURANT.address}. Our phone number is ${RESTAURANT.phone}.` }),

  delivery: () => ({
    text: `Delivery costs ${formatPrice(PRICING.deliveryFee)} and is free on orders over ${formatPrice(PRICING.freeDeliveryOver)} (minimum ${formatPrice(PRICING.minDeliverySubtotal)}). Pickup orders are usually ready in about 20 minutes.`,
    link: { to: '/menu', label: 'Start an order' },
  }),

  reservation: () => ({
    text: `You can book a table for up to ${RESERVATION_RULES.table.max} guests and it is confirmed right away. Birthday parties, corporate gatherings and anniversaries for ${RESERVATION_RULES.event.min} to ${RESERVATION_RULES.event.max} guests are approved by our team.`,
    link: { to: '/reservations', label: 'Make a booking' },
  }),

  vegan: ({ menu }) => {
    const dishes = listDietDishes(menu, 'vegan')
    return dishes.length
      ? { text: `Our vegan dishes are ${joinWithAnd(dishes.map((item) => item.name))}.`, itemIds: dishes.slice(0, 4).map((item) => item.id), link: { to: '/menu?diet=vegan', label: 'See all vegan dishes' } }
      : { text: 'We have no vegan dishes available right now, sorry.' }
  },

  'dairy-free': ({ menu }) => {
    const dishes = listDietDishes(menu, 'dairy-free')
    return dishes.length
      ? { text: `Dairy-free choices include ${joinWithAnd(dishes.slice(0, 5).map((item) => item.name))}.`, itemIds: dishes.slice(0, 4).map((item) => item.id), link: { to: '/menu?diet=dairy-free', label: 'See all dairy-free dishes' } }
      : { text: 'We have no dairy-free dishes available right now, sorry.' }
  },

  'order-status': (context) => {
    const active = getMyOrders(context).find((order) => ['pending', 'preparing', 'ready'].includes(order.status))
    if (!active) return { text: 'You have no orders in progress right now.', link: { to: '/menu', label: 'Start an order' } }
    return {
      text: `Order ${active.id} is at this step: ${getStatusLabel(active.status, active.type)}.`,
      link: { to: `/orders/${active.id}`, label: 'Track it live' },
    }
  },

  allergy: () => ({
    text: `Every dish lists its ingredients on the menu. For a serious allergy, please call us at ${RESTAURANT.phone} before ordering so the kitchen can check for you.`,
    link: { to: '/menu', label: 'Check ingredients' },
  }),
}

const FALLBACK = {
  text: 'Sorry, I can only help with our menu, orders and bookings for now. Try one of the suggested questions below.',
  showSuggestions: true,
}

/**
 * Main entry point used by the chat component.
 * @param {string} message  what the customer typed
 * @param {{menu, orders, user, ownerId}} context  live data from the app
 * @returns {{ intent: string, text: string, itemIds?: string[], link?: {to,label}, showSuggestions?: boolean }}
 */
export function getAssistantReply(message, context) {
  if (!normalize(message)) return { intent: 'empty', text: 'Type a question, or tap one of the suggestions below.', showSuggestions: true }
  const intent = detectIntent(message)
  if (!intent) return { intent: 'fallback', ...FALLBACK }
  return { intent: intent.id, ...RESPONDERS[intent.id](context) }
}
