/**
 * reservations.js — helpers for booking times and dining-room capacity.
 */
import { RESERVATION_RULES } from '../data/restaurantInfo.js'
import { toDateInputValue } from './format.js'

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const toTime = (totalMinutes) =>
  `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`

/** ["11:00", "11:30", … "21:00"] — every bookable time of day. */
export function getTimeSlots() {
  const slots = []
  const last = toMinutes(RESERVATION_RULES.lastSlot)
  for (let m = toMinutes(RESERVATION_RULES.firstSlot); m <= last; m += RESERVATION_RULES.slotMinutes) {
    slots.push(toTime(m))
  }
  return slots
}

/** True when the slot is today and its time is already in the past. */
export function isSlotInPast(date, time, now = new Date()) {
  if (date !== toDateInputValue(now)) return date < toDateInputValue(now)
  return toMinutes(time) <= now.getHours() * 60 + now.getMinutes()
}

/** Guests already booked for a date + time (cancelled bookings do not count). */
export function getBookedSeats(reservations, date, time, ignoreId = null) {
  return reservations
    .filter((r) => r.date === date && r.time === time && r.status !== 'cancelled' && r.id !== ignoreId)
    .reduce((sum, r) => sum + Number(r.partySize), 0)
}

/** Seats still free in a slot. */
export function getSeatsLeft(reservations, date, time) {
  return Math.max(0, RESERVATION_RULES.seatsPerSlot - getBookedSeats(reservations, date, time))
}

/** Sorts by date then time (soonest first). */
export function sortByDateTime(reservations) {
  return [...reservations].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
}

/** True if the booking date/time has not happened yet. */
export function isUpcoming(reservation, now = new Date()) {
  return !isSlotInPast(reservation.date, reservation.time, now)
}
