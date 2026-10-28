/**
 * analytics.js — numbers for the admin dashboard, computed from orders and
 * feedback. Cancelled orders are left out of sales figures.
 *
 * These are pure functions: they receive the data and "now" as arguments,
 * which keeps them predictable and lets the unit tests use fixed dates.
 */
import { addDays, roundMoney, toDateInputValue } from './format.js'

const isCounted = (order) => order.status !== 'cancelled'
const dayKey = (iso) => toDateInputValue(new Date(iso))

/** Orders and revenue for each of the last `days` days (oldest first). */
export function getOrdersPerDay(orders, days = 7, now = new Date()) {
  const buckets = []
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = addDays(now, -i)
    buckets.push({
      key: toDateInputValue(date),
      label: date.toLocaleDateString('en-CA', { weekday: 'short' }),
      detail: date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
      count: 0,
      revenue: 0,
    })
  }
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]))
  for (const order of orders.filter(isCounted)) {
    const bucket = byKey.get(dayKey(order.createdAt))
    if (bucket) {
      bucket.count += 1
      bucket.revenue = roundMoney(bucket.revenue + order.total)
    }
  }
  return buckets
}

/** Orders and revenue for each of the last `weeks` 7-day periods (oldest first). */
export function getOrdersPerWeek(orders, weeks = 4, now = new Date()) {
  const daily = getOrdersPerDay(orders, weeks * 7, now)
  const result = []
  for (let w = 0; w < weeks; w += 1) {
    const slice = daily.slice(w * 7, w * 7 + 7)
    result.push({
      key: slice[0].key,
      label: w === weeks - 1 ? 'This week' : `${weeks - 1 - w} wk ago`,
      detail: `${slice[0].detail} to ${slice.at(-1).detail}`,
      count: slice.reduce((sum, day) => sum + day.count, 0),
      revenue: roundMoney(slice.reduce((sum, day) => sum + day.revenue, 0)),
    })
  }
  return result
}

/** Best sellers by quantity. Pass a category to rank only that category. */
export function getPopularItems(orders, menu, { category = null, limit = 5 } = {}) {
  const quantities = new Map()
  for (const order of orders.filter(isCounted)) {
    for (const line of order.items) {
      quantities.set(line.itemId, (quantities.get(line.itemId) ?? 0) + line.quantity)
    }
  }
  return menu
    .filter((item) => !category || item.category === category)
    .map((item) => ({ ...item, quantity: quantities.get(item.id) ?? 0 }))
    .filter((item) => item.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name))
    .slice(0, limit)
}

/** Headline numbers for today. */
export function getTodayStats(orders, now = new Date()) {
  const today = toDateInputValue(now)
  const todays = orders.filter((order) => dayKey(order.createdAt) === today && isCounted(order))
  return {
    ordersToday: todays.length,
    revenueToday: roundMoney(todays.reduce((sum, order) => sum + order.total, 0)),
    activeOrders: orders.filter((order) => ['pending', 'preparing', 'ready'].includes(order.status)).length,
    deliveryShare: todays.length
      ? Math.round((todays.filter((order) => order.type === 'delivery').length / todays.length) * 100)
      : 0,
  }
}

/** Words that tell us which topic a comment is about. */
const THEMES = [
  { id: 'food', label: 'Food quality', words: ['delicious', 'tasty', 'fresh', 'perfect', 'perfectly', 'amazing', 'creamy', 'best', 'loved', 'excellent', 'gooey', 'salty', 'bland', 'flavour', 'flavor', 'crust'] },
  { id: 'speed', label: 'Delivery and wait times', words: ['delivery', 'arrived', 'fast', 'quick', 'slow', 'late', 'wait', 'cold', 'hot', 'lukewarm'] },
  { id: 'service', label: 'Staff and service', words: ['staff', 'friendly', 'service', 'rude', 'helpful', 'server'] },
  { id: 'value', label: 'Value and portions', words: ['price', 'portions', 'portion', 'value', 'worth', 'expensive'] },
  { id: 'accuracy', label: 'Order accuracy', words: ['missing', 'wrong', 'forgot'] },
  { id: 'ordering', label: 'Online ordering', words: ['online', 'ordering', 'app', 'website', 'easy'] },
]

/** Which theme ids a comment mentions. */
export function detectThemes(comment = '') {
  const words = comment.toLowerCase().match(/[a-z]+/g) ?? []
  return THEMES.filter((theme) => theme.words.some((word) => words.includes(word))).map((theme) => theme.id)
}

const countThemes = (entries) => {
  const counts = new Map()
  for (const entry of entries) {
    for (const id of detectThemes(entry.comment)) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return THEMES.filter((theme) => counts.has(theme.id))
    .map((theme) => ({ id: theme.id, label: theme.label, count: counts.get(theme.id) }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Turns all feedback into a short summary for the admin:
 * average rating, how many of each star, what people praise (4–5 stars)
 * and what they complain about (1–3 stars), plus a one-paragraph summary.
 */
export function summarizeFeedback(feedback) {
  const count = feedback.length
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  feedback.forEach((entry) => {
    distribution[entry.rating] += 1
  })
  const average = count ? roundMoney(feedback.reduce((sum, entry) => sum + entry.rating, 0) / count) : 0

  const praise = countThemes(feedback.filter((entry) => entry.rating >= 4))
  const complaints = countThemes(feedback.filter((entry) => entry.rating <= 3))

  let summary = 'No reviews yet. Feedback appears here after customers rate their delivered orders.'
  if (count > 0) {
    const parts = [`Customers rate us ${average.toFixed(1)} out of 5 from ${count} review${count === 1 ? '' : 's'}.`]
    if (praise[0]) parts.push(`Most praise is about ${praise[0].label.toLowerCase()} (${praise[0].count} mentions).`)
    if (complaints[0]) {
      parts.push(`The most common complaint is ${complaints[0].label.toLowerCase()} (${complaints[0].count} mentions).`)
    } else {
      parts.push('There are no complaints so far.')
    }
    summary = parts.join(' ')
  }

  const recent = [...feedback].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4)
  return { count, average, distribution, praise, complaints, summary, recent }
}

/** Orders placed in the last `days` days, today included. */
export function getOrdersInLastDays(orders, days, now = new Date()) {
  const firstDay = toDateInputValue(addDays(now, -(days - 1)))
  return orders.filter((order) => dayKey(order.createdAt) >= firstDay)
}

/** Feedback written in the last `days` days, today included. */
export function getFeedbackInLastDays(feedback, days, now = new Date()) {
  const firstDay = toDateInputValue(addDays(now, -(days - 1)))
  return feedback.filter((entry) => dayKey(entry.createdAt) >= firstDay)
}

/**
 * Round axis ticks for a chart whose largest value is `max`:
 * getNiceTicks(37) → [0, 10, 20, 30, 40]
 */
export function getNiceTicks(max, approxCount = 4) {
  if (max <= 0) return [0, 1]
  const rough = max / approxCount
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const residual = rough / magnitude
  const step = (residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10) * magnitude
  const top = Math.ceil(max / step) * step
  const ticks = []
  for (let value = 0; value <= top + step / 2; value += step) ticks.push(Math.round(value * 100) / 100)
  return ticks
}
