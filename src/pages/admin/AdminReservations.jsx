/**
 * AdminReservations.jsx — manage table bookings and special events.
 *
 * - Filters: status, booking type, upcoming or past.
 * - Bookings are grouped by date.
 * - Approve moves an event request from "pending" to "confirmed"; Cancel
 *   asks for confirmation first. Both notify the customer.
 */
import { useState } from 'react'
import { useRestaurant } from '../../context/RestaurantContext.js'
import { useToast } from '../../context/ToastContext.js'
import { useNow } from '../../hooks/useNow.js'
import { getErrorMessage } from '../../services/apiError.js'
import { describeBooking, getEventLabel } from '../../services/reservationService.js'
import { formatDate, formatDateTime, formatTime } from '../../utils/format.js'
import { isUpcoming, sortByDateTime } from '../../utils/reservations.js'
import { StatusBadge } from '../../components/common/Badges.jsx'
import { EmptyState } from '../../components/common/Feedback.jsx'
import { ConfirmDialog } from '../../components/common/Modal.jsx'

const STATUS_FILTERS = [
  { value: 'pending', label: 'Waiting for approval' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All statuses' },
]

export default function AdminReservations() {
  const { reservations, updateReservationStatus } = useRestaurant()
  const { showToast } = useToast()
  const now = useNow()

  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [when, setWhen] = useState('upcoming')
  const [busyId, setBusyId] = useState(null)
  const [toCancel, setToCancel] = useState(null)

  const filtered = sortByDateTime(
    reservations.filter(
      (reservation) =>
        (status === 'all' || reservation.status === status) &&
        (type === 'all' || reservation.type === type) &&
        (when === 'upcoming' ? isUpcoming(reservation, now) : !isUpcoming(reservation, now)),
    ),
  )
  if (when === 'past') filtered.reverse() // most recent first

  // Group bookings by date: { '2026-11-02': [...], ... } (keeps the sort order)
  const byDate = {}
  for (const reservation of filtered) {
    byDate[reservation.date] = [...(byDate[reservation.date] ?? []), reservation]
  }

  const pendingCount = reservations.filter((reservation) => reservation.status === 'pending').length

  const change = async (reservation, nextStatus) => {
    setBusyId(reservation.id)
    try {
      await updateReservationStatus(reservation.id, nextStatus, 'admin')
      showToast(
        nextStatus === 'confirmed'
          ? `${reservation.id} approved. ${reservation.name} was notified.`
          : `${reservation.id} cancelled. ${reservation.name} was notified.`,
      )
    } catch (error) {
      showToast(getErrorMessage(error), { type: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="admin-page">
      <header className="page-header">
        <div>
          <h1>Reservations</h1>
          <p>
            {pendingCount > 0
              ? `${pendingCount} event request${pendingCount === 1 ? '' : 's'} waiting for approval.`
              : 'No requests are waiting for approval.'}
          </p>
        </div>
      </header>

      <div className="admin-toolbar">
        <label htmlFor="res-status" className="sr-only">
          Status
        </label>
        <select id="res-status" value={status} onChange={(event) => setStatus(event.target.value)}>
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label htmlFor="res-type" className="sr-only">
          Booking type
        </label>
        <select id="res-type" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">Tables and events</option>
          <option value="table">Tables only</option>
          <option value="event">Special events only</option>
        </select>
        <div className="segmented" role="group" aria-label="Time">
          <button type="button" aria-pressed={when === 'upcoming'} onClick={() => setWhen('upcoming')}>
            Upcoming
          </button>
          <button type="button" aria-pressed={when === 'past'} onClick={() => setWhen('past')}>
            Past
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📅" title="No bookings match these filters">
          Try another status or switch between upcoming and past.
        </EmptyState>
      ) : (
        Object.entries(byDate).map(([date, list]) => (
          <section key={date} className="day-group" aria-labelledby={`day-${date}`}>
            <h2 id={`day-${date}`}>
              {formatDate(date)} <span className="muted small">({list.length})</span>
            </h2>
            {list.map((reservation) => {
              const upcoming = isUpcoming(reservation, now)
              const busy = busyId === reservation.id
              return (
                <article key={reservation.id} className={`res-card ${reservation.type === 'event' ? 'is-event' : ''}`}>
                  <div className="res-card__time">{formatTime(reservation.time)}</div>
                  <div className="res-card__body">
                    <span className="res-card__title">
                      {reservation.name}, {describeBooking(reservation)}
                    </span>
                    <span className="muted">
                      {reservation.type === 'event' ? getEventLabel(reservation.eventType) : 'Table booking'}, code{' '}
                      {reservation.id}, booked {formatDateTime(reservation.createdAt)}
                    </span>
                    <span>
                      {reservation.email}, {reservation.phone}
                    </span>
                    {reservation.specialRequests && <p className="res-card__request">“{reservation.specialRequests}”</p>}
                  </div>
                  <div className="res-card__actions">
                    <StatusBadge kind="reservation" status={reservation.status} />
                    {upcoming && reservation.status === 'pending' && (
                      <button type="button" className="button button--basil button--small" disabled={busy} onClick={() => change(reservation, 'confirmed')}>
                        Approve
                      </button>
                    )}
                    {upcoming && reservation.status !== 'cancelled' && (
                      <button type="button" className="button button--danger button--small" disabled={busy} onClick={() => setToCancel(reservation)}>
                        Cancel
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </section>
        ))
      )}

      <ConfirmDialog
        open={Boolean(toCancel)}
        title={`Cancel ${toCancel?.id ?? ''}?`}
        message={
          toCancel
            ? `${toCancel.name}'s ${describeBooking(toCancel)} on ${formatDate(toCancel.date)} at ${formatTime(toCancel.time)} will be cancelled and they will be notified.`
            : ''
        }
        confirmLabel="Cancel booking"
        busy={Boolean(busyId)}
        onConfirm={async () => {
          await change(toCancel, 'cancelled')
          setToCancel(null)
        }}
        onCancel={() => setToCancel(null)}
      />
    </div>
  )
}
