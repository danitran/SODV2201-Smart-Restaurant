import { useState } from 'react'
import { describeBooking } from '../../services/reservationService.js'
import { formatDate, formatTime } from '../../utils/format.js'
import { isUpcoming, sortByDateTime } from '../../utils/reservations.js'
import { StatusBadge } from '../common/Badges.jsx'
import { ConfirmDialog } from '../common/Modal.jsx'

export function ReservationList({ reservations, onCancel, emptyText = 'No bookings yet.' }) {
  const [toCancel, setToCancel] = useState(null)
  const [busy, setBusy] = useState(false)

  if (reservations.length === 0) return <p className="muted small">{emptyText}</p>

  const confirmCancel = async () => {
    setBusy(true)
    try {
      await onCancel(toCancel)
      setToCancel(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ul className="booking-list">
        {sortByDateTime(reservations).map((reservation) => {
          const upcoming = isUpcoming(reservation)
          const canCancel = upcoming && reservation.status !== 'cancelled'
          return (
            <li key={reservation.id} className={`booking ${upcoming ? '' : 'is-past'}`}>
              <div className="booking__when">
                <strong>{formatDate(reservation.date)}</strong>
                <span>{formatTime(reservation.time)}</span>
              </div>
              <div className="booking__info">
                <span className="booking__what">{describeBooking(reservation)}</span>
                <span className="muted small">
                  Code {reservation.id}
                  {!upcoming && ', past booking'}
                </span>
                <StatusBadge kind="reservation" status={reservation.status} />
              </div>
              {canCancel && (
                <button type="button" className="button button--danger button--small" onClick={() => setToCancel(reservation)}>
                  Cancel
                </button>
              )}
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={Boolean(toCancel)}
        title="Cancel this booking?"
        message={
          toCancel
            ? `Your ${describeBooking(toCancel)} on ${formatDate(toCancel.date)} at ${formatTime(toCancel.time)} will be cancelled.`
            : ''
        }
        confirmLabel="Cancel booking"
        busy={busy}
        onConfirm={confirmCancel}
        onCancel={() => setToCancel(null)}
      />
    </>
  )
}
