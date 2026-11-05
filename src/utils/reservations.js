import { RESERVATION_RULES } from '../data/restaurantInfo.js'
import { toDateInputValue } from './format.js'

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const toTime = (totalMinutes) =>
  `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`

export function getTimeSlots() {
  const slots = []
  const last = toMinutes(RESERVATION_RULES.lastSlot)
  for (let m = toMinutes(RESERVATION_RULES.firstSlot); m <= last; m += RESERVATION_RULES.slotMinutes) {
    slots.push(toTime(m))
  }
  return slots
}

export function isSlotInPast(date, time, now = new Date()) {
  if (date !== toDateInputValue(now)) return date < toDateInputValue(now)
  return toMinutes(time) <= now.getHours() * 60 + now.getMinutes()
}

export function getBookedSeats(reservations, date, time, ignoreId = null) {
  return reservations
    .filter((r) => r.date === date && r.time === time && r.status !== 'cancelled' && r.id !== ignoreId)
    .reduce((sum, r) => sum + Number(r.partySize), 0)
}

export function getSeatsLeft(reservations, date, time) {
  return Math.max(0, RESERVATION_RULES.seatsPerSlot - getBookedSeats(reservations, date, time))
}

export function sortByDateTime(reservations) {
  return [...reservations].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
}

export function isUpcoming(reservation, now = new Date()) {
  return !isSlotInPast(reservation.date, reservation.time, now)
}
