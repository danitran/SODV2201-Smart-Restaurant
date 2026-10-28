/**
 * reservationService.js — table bookings and special events.
 *
 * Rules:
 *   - Regular tables are confirmed straight away if the time slot has room.
 *   - Special events (birthdays, corporate gatherings…) start as "pending"
 *     and wait for an admin to approve them.
 *   - A confirmation notification is created as soon as a booking succeeds,
 *     and another one whenever the restaurant approves or cancels it.
 */
import { ApiError } from './apiError.js'
import { updateDatabase } from './database.js'
import { simulateNetwork } from './network.js'
import { addNotification } from './notificationService.js'
import { EVENT_TYPES, RESERVATION_RULES, RESTAURANT } from '../data/restaurantInfo.js'
import { formatDate, formatTime } from '../utils/format.js'
import { getBookedSeats, isUpcoming } from '../utils/reservations.js'
import { hasErrors, validateReservation } from '../utils/validation.js'

export const getEventLabel = (eventType) => EVENT_TYPES.find((type) => type.id === eventType)?.label ?? 'Special event'

/** "table for 4" or "birthday party for 16 guests" */
export function describeBooking(reservation) {
  return reservation.type === 'event'
    ? `${getEventLabel(reservation.eventType).toLowerCase()} for ${reservation.partySize} guests`
    : `table for ${reservation.partySize}`
}

const when = (reservation) => `${formatDate(reservation.date)} at ${formatTime(reservation.time)}`

export async function createReservation(input, { ownerId, userId = null }) {
  await simulateNetwork()
  return updateDatabase((db) => {
    const errors = validateReservation(input)
    if (hasErrors(errors)) throw new ApiError('Please fix the highlighted fields.', errors)

    const partySize = Number(input.partySize)
    const seatsTaken = getBookedSeats(db.reservations, input.date, input.time)
    if (seatsTaken + partySize > RESERVATION_RULES.seatsPerSlot) {
      const left = Math.max(0, RESERVATION_RULES.seatsPerSlot - seatsTaken)
      throw new ApiError(
        `${formatTime(input.time)} on ${formatDate(input.date)} only has room for ${left} more guest${left === 1 ? '' : 's'}. Choose another time.`,
        { time: 'Not enough seats at this time.' },
      )
    }

    const isEvent = input.type === 'event'
    db.counters.reservation += 1
    const now = new Date().toISOString()
    const reservation = {
      id: `RES-${db.counters.reservation}`,
      ownerId,
      userId,
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      date: input.date,
      time: input.time,
      partySize,
      type: isEvent ? 'event' : 'table',
      eventType: isEvent ? input.eventType : '',
      specialRequests: (input.specialRequests ?? '').trim(),
      status: isEvent ? 'pending' : 'confirmed',
      createdAt: now,
      updatedAt: now,
    }
    db.reservations.push(reservation)

    addNotification(db, {
      ownerId,
      title: isEvent ? 'Event request received' : 'Reservation confirmed',
      message: isEvent
        ? `Your ${describeBooking(reservation)} on ${when(reservation)} is waiting for approval. Code ${reservation.id}.`
        : `Your ${describeBooking(reservation)} on ${when(reservation)} is booked. Code ${reservation.id}.`,
      link: '/reservations',
      source: 'customer',
    })
    return reservation
  })
}

/**
 * Changes a booking's status.
 * @param {'confirmed'|'cancelled'} nextStatus
 * @param {'admin'|'customer'} by  who is making the change
 */
export async function updateReservationStatus(id, nextStatus, by = 'admin') {
  await simulateNetwork(150)
  return updateDatabase((db) => {
    const reservation = db.reservations.find((candidate) => candidate.id === id)
    if (!reservation) throw new ApiError(`Reservation ${id} was not found.`)

    const allowed = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['cancelled'],
      cancelled: [],
    }
    if (!allowed[reservation.status].includes(nextStatus)) {
      throw new ApiError(`Reservation ${id} is already ${reservation.status}.`)
    }
    if (by === 'customer' && nextStatus !== 'cancelled') {
      throw new ApiError('Only the restaurant can approve bookings.')
    }
    if (!isUpcoming(reservation)) {
      throw new ApiError('This booking time has already passed, so it can no longer be changed.')
    }

    reservation.status = nextStatus
    reservation.updatedAt = new Date().toISOString()

    if (by === 'admin') {
      addNotification(db, {
        ownerId: reservation.ownerId,
        title: nextStatus === 'confirmed' ? 'Booking approved' : 'Booking cancelled',
        message:
          nextStatus === 'confirmed'
            ? `Your ${describeBooking(reservation)} on ${when(reservation)} is approved. See you then!`
            : `Your ${describeBooking(reservation)} on ${when(reservation)} was cancelled by the restaurant. Call ${RESTAURANT.phone} to rebook.`,
        link: '/reservations',
        source: 'restaurant',
      })
    }
    return reservation
  })
}
