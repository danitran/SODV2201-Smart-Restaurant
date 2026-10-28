/**
 * validation.js — form rules shared by the pages (instant feedback) and the
 * services (final check before saving, like a real back end would do).
 *
 * Every validate…() function returns an object of field → error message.
 * An empty object means the form is valid. Example:
 *   validateCheckout({ name: '' }) → { name: 'Enter your name.', ... }
 */
import { CATEGORIES, DIETARY_TAGS, PRICING, RESERVATION_RULES } from '../data/restaurantInfo.js'
import { getTimeSlots, isSlotInPast } from './reservations.js'
import { addDays, parseDateInput, toDateInputValue } from './format.js'

export const hasErrors = (errors) => Object.keys(errors).length > 0

export const digitsOnly = (value = '') => String(value).replace(/\D/g, '')

export function isValidEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim())
}

/** Accepts 403-555-0123, (403) 555 0123, +1 403 555 0123 … (10 digits, optional leading 1). */
export function isValidPhone(phone = '') {
  const digits = digitsOnly(phone)
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))
}

/** Shared checks for name / email / phone used by several forms. */
function validateContact({ name = '', email = '', phone = '' }, errors) {
  if (name.trim().length < 2) errors.name = 'Enter your name (at least 2 letters).'
  if (!isValidEmail(email)) errors.email = 'Enter a valid email, for example name@example.com.'
  if (!isValidPhone(phone)) errors.phone = 'Enter a 10-digit phone number, for example 403-555-0123.'
}

/** Checkout form: contact details, address for delivery, minimum delivery order. */
export function validateCheckout(form, { subtotal = 0 } = {}) {
  const errors = {}
  validateContact(form, errors)
  if (form.type !== 'delivery' && form.type !== 'pickup') {
    errors.type = 'Choose delivery or pickup.'
  }
  if (form.type === 'delivery') {
    if ((form.address ?? '').trim().length < 6) {
      errors.address = 'Enter the street address for delivery.'
    }
    if (subtotal > 0 && subtotal < PRICING.minDeliverySubtotal) {
      errors.type = `Delivery needs a subtotal of at least $${PRICING.minDeliverySubtotal}. Add more items or choose pickup.`
    }
  }
  if ((form.notes ?? '').length > 300) errors.notes = 'Keep notes under 300 characters.'
  return errors
}

/** Reservation form: date/time in the future and inside opening hours, party size limits. */
export function validateReservation(form, now = new Date()) {
  const errors = {}
  validateContact(form, errors)

  const isEvent = form.type === 'event'
  const limits = isEvent ? RESERVATION_RULES.event : RESERVATION_RULES.table
  const size = Number(form.partySize)

  if (!Number.isInteger(size) || size < limits.min || size > limits.max) {
    errors.partySize = isEvent
      ? `Events are for ${limits.min} to ${limits.max} guests.`
      : `Tables are for ${limits.min} to ${limits.max} guests. For bigger groups, book a special event.`
  }
  if (isEvent && !form.eventType) errors.eventType = 'Choose the kind of event.'

  const today = toDateInputValue(now)
  const lastDay = toDateInputValue(addDays(now, RESERVATION_RULES.maxDaysAhead))
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date ?? '') || Number.isNaN(parseDateInput(form.date).getTime())) {
    errors.date = 'Choose a date.'
  } else if (form.date < today) {
    errors.date = 'Choose today or a later date.'
  } else if (form.date > lastDay) {
    errors.date = `We take bookings up to ${RESERVATION_RULES.maxDaysAhead} days ahead.`
  }

  if (!getTimeSlots().includes(form.time)) {
    errors.time = 'Choose a time between 11:00 AM and 9:00 PM.'
  } else if (!errors.date && isSlotInPast(form.date, form.time, now)) {
    errors.time = 'That time has already passed today. Choose a later time.'
  }

  if ((form.specialRequests ?? '').length > 500) {
    errors.specialRequests = 'Keep special requests under 500 characters.'
  }
  return errors
}

/** Admin menu form. existingItems is used to block duplicate names. */
export function validateMenuItem(item, existingItems = []) {
  const errors = {}
  const name = (item.name ?? '').trim()
  const price = Number(item.price)

  if (name.length < 2) errors.name = 'Enter a dish name.'
  else if (name.length > 60) errors.name = 'Keep the name under 60 characters.'
  else if (
    existingItems.some((other) => other.id !== item.id && other.name.toLowerCase() === name.toLowerCase())
  ) {
    errors.name = 'Another dish already has this name.'
  }

  if (!CATEGORIES.some((category) => category.id === item.category)) errors.category = 'Choose a category.'
  if (item.price === '' || Number.isNaN(price) || price <= 0) errors.price = 'Enter a price above $0.'
  else if (price > 500) errors.price = 'Price looks too high. Enter $500 or less.'
  if ((item.description ?? '').trim().length < 10) errors.description = 'Add a short description (10+ characters).'

  const unknownTags = (item.dietary ?? []).filter((tag) => !DIETARY_TAGS.some((known) => known.id === tag))
  if (unknownTags.length > 0) errors.dietary = `Unknown dietary tag: ${unknownTags.join(', ')}.`
  return errors
}

/** Sign-up form. */
export function validateRegistration(form) {
  const errors = {}
  validateContact(form, errors)
  if ((form.password ?? '').length < 6) errors.password = 'Use at least 6 characters.'
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.'
  return errors
}

/** Profile form on the account page (email cannot be changed there). */
export function validateProfile(form) {
  const errors = {}
  if ((form.name ?? '').trim().length < 2) errors.name = 'Enter your name (at least 2 letters).'
  if (form.phone && !isValidPhone(form.phone)) errors.phone = 'Enter a 10-digit phone number, for example 403-555-0123.'
  return errors
}

/** Feedback form on a delivered order. */
export function validateFeedback({ rating, comment = '' }) {
  const errors = {}
  if (!Number.isInteger(Number(rating)) || rating < 1 || rating > 5) errors.rating = 'Pick 1 to 5 stars.'
  if (comment.length > 300) errors.comment = 'Keep your comment under 300 characters.'
  return errors
}
