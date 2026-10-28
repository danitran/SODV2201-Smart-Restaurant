/**
 * format.js — small helpers that turn raw values into text for the UI.
 * They are pure functions (same input → same output), so they are easy to
 * reuse in any component and easy to unit test.
 */

const currencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
})

/** 18.99 → "$18.99" */
export function formatPrice(amount) {
  return currencyFormatter.format(Number(amount) || 0)
}

/** Round to cents so 0.1 + 0.2 style float errors never reach the bill. */
export function roundMoney(amount) {
  return Math.round((Number(amount) + Number.EPSILON) * 100) / 100
}

/** Date → "2026-11-02" using the local time zone (for <input type="date">). */
export function toDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** "2026-11-02" → Date at local midnight (avoids the UTC shift of new Date("2026-11-02")). */
export function parseDateInput(value) {
  const [year, month, day] = String(value).split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Adds whole days to a date and returns a new Date. */
export function addDays(date, days) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

/** "2026-11-02" or a Date → "Mon, Nov 2" */
export function formatDate(value) {
  const date = typeof value === 'string' && value.length === 10 ? parseDateInput(value) : new Date(value)
  return date.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })
}

/** "19:00" → "7:00 PM" */
export function formatTime(value) {
  const [hours, minutes] = String(value).split(':').map(Number)
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`
}

/** ISO timestamp → "Nov 2, 7:05 PM" */
export function formatDateTime(iso) {
  const date = new Date(iso)
  const time = formatTime(`${date.getHours()}:${date.getMinutes()}`)
  return `${date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}, ${time}`
}

/** ISO timestamp → "just now", "12 min ago", "3 h ago", "2 days ago" */
export function timeAgo(iso, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (seconds < 45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? '1 day ago' : `${days} days ago`
}

/** ["A"] → "A", ["A","B"] → "A and B", ["A","B","C"] → "A, B, and C" */
export function joinWithAnd(words) {
  if (words.length <= 1) return words.join('')
  if (words.length === 2) return `${words[0]} and ${words[1]}`
  return `${words.slice(0, -1).join(', ')}, and ${words.at(-1)}`
}

/** 1 → "1 item", 3 → "3 items" */
export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}
