import { useState } from 'react'
import { useAuth } from '../context/AuthContext.js'
import { useRestaurant } from '../context/RestaurantContext.js'
import { useToast } from '../context/ToastContext.js'
import { useNow } from '../hooks/useNow.js'
import { EVENT_TYPES, RESERVATION_RULES, RESTAURANT } from '../data/restaurantInfo.js'
import { getErrorMessage } from '../services/apiError.js'
import { describeBooking } from '../services/reservationService.js'
import { addDays, formatDate, formatTime, toDateInputValue } from '../utils/format.js'
import { focusFirstError } from '../utils/dom.js'
import { getSeatsLeft, getTimeSlots, isSlotInPast } from '../utils/reservations.js'
import { hasErrors, validateReservation } from '../utils/validation.js'
import { SelectField, TextAreaField, TextField } from '../components/common/FormFields.jsx'
import { Icon } from '../components/common/Icon.jsx'
import { ReservationList } from '../components/reservations/ReservationList.jsx'

const blankForm = (user) => ({
  type: 'table',
  eventType: '',
  date: toDateInputValue(addDays(new Date(), 1)),
  time: '19:00',
  partySize: 2,
  name: user?.name ?? '',
  email: user?.email ?? '',
  phone: user?.phone ?? '',
  specialRequests: '',
})

export default function Reservations() {
  const { user, ownerId } = useAuth()
  const { reservations, createReservation, updateReservationStatus } = useRestaurant()
  const { showToast } = useToast()

  const [form, setForm] = useState(() => blankForm(user))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [booked, setBooked] = useState(null)
  const now = useNow()

  const isEvent = form.type === 'event'
  const limits = isEvent ? RESERVATION_RULES.event : RESERVATION_RULES.table
  const seatsLeft = getSeatsLeft(reservations, form.date, form.time)
  const myBookings = reservations.filter((reservation) => reservation.ownerId === ownerId)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: name === 'partySize' ? Number(value) : value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const chooseType = (type) => {
    const nextLimits = type === 'event' ? RESERVATION_RULES.event : RESERVATION_RULES.table
    setForm((current) => ({
      ...current,
      type,
      partySize: Math.min(nextLimits.max, Math.max(nextLimits.min, current.partySize)),
    }))
    setErrors({})
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    const found = validateReservation(form)
    if (hasErrors(found)) {
      setErrors(found)
      setFormError('Please fix the highlighted fields.')
      focusFirstError(found)
      return
    }

    setSubmitting(true)
    try {
      const reservation = await createReservation(form, { ownerId, userId: user?.id ?? null })
      setBooked(reservation)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      showToast(
        reservation.status === 'confirmed' ? `Table booked. Code ${reservation.id}.` : `Event request sent. Code ${reservation.id}.`,
      )
    } catch (error) {
      setErrors(error.fieldErrors ?? {})
      setFormError(getErrorMessage(error))
      focusFirstError(error.fieldErrors ?? {})
    } finally {
      setSubmitting(false)
    }
  }

  const startOver = () => {
    setBooked(null)
    setForm(blankForm(user))
    setErrors({})
  }

  const cancelBooking = async (reservation) => {
    try {
      await updateReservationStatus(reservation.id, 'cancelled', 'customer')
      showToast(`Booking ${reservation.id} was cancelled.`, { type: 'info' })
    } catch (error) {
      showToast(getErrorMessage(error), { type: 'error' })
    }
  }

  const timeOptions = getTimeSlots().map((slot) => {
    const passed = isSlotInPast(form.date, slot, now)
    const full = getSeatsLeft(reservations, form.date, slot) === 0
    return {
      value: slot,
      label: `${formatTime(slot)}${passed ? ' (passed)' : full ? ' (full)' : ''}`,
      disabled: passed || full,
    }
  })

  return (
    <div className="container page">
      <header className="page-header">
        <div>
          <h1>Reservations</h1>
          <p>
            Book a table for up to {RESERVATION_RULES.table.max} guests, or plan a birthday party, corporate gathering
            or anniversary for {RESERVATION_RULES.event.min} to {RESERVATION_RULES.event.max} guests.
          </p>
        </div>
      </header>

      <div className="two-column">
        {booked ? (
          <section className="panel booking-done" aria-labelledby="booked-title">
            <p className="booking-done__icon" aria-hidden="true">
              <Icon name={booked.status === 'confirmed' ? 'check' : 'clock'} size={28} />
            </p>
            <h2 id="booked-title">{booked.status === 'confirmed' ? 'Your table is booked' : 'Your event request was sent'}</h2>
            <p>
              {describeBooking(booked).replace(/^./, (letter) => letter.toUpperCase())} on {formatDate(booked.date)} at{' '}
              {formatTime(booked.time)}, under {booked.name}.
            </p>
            <p className="booking-done__code">
              Confirmation code <strong>{booked.id}</strong>
            </p>
            <p className="muted">
              {booked.status === 'confirmed'
                ? 'The confirmation is in your notifications (the bell at the top).'
                : 'Our events team reviews requests within a day. You will get a notification when it is approved.'}{' '}
              Need to change something? Call {RESTAURANT.phone}.
            </p>
            <button type="button" className="button" onClick={startOver}>
              Make another booking
            </button>
          </section>
        ) : (
          <form className="panel" onSubmit={handleSubmit} noValidate>
            {formError && (
              <p className="form-banner" role="alert">
                {formError}
              </p>
            )}

            <fieldset className="field">
              <legend>What are you booking?</legend>
              <div className="order-type__options">
                <label className="order-type__option">
                  <input type="radio" name="type" checked={!isEvent} onChange={() => chooseType('table')} />
                  <span>
                    <strong>A table</strong>
                    <span className="small muted">Confirmed right away</span>
                  </span>
                </label>
                <label className="order-type__option">
                  <input type="radio" name="type" checked={isEvent} onChange={() => chooseType('event')} />
                  <span>
                    <strong>A special event</strong>
                    <span className="small muted">Approved by our team</span>
                  </span>
                </label>
              </div>
            </fieldset>

            {isEvent && (
              <SelectField
                label="Kind of event"
                name="eventType"
                placeholder="Choose one"
                options={EVENT_TYPES.map((type) => ({ value: type.id, label: type.label }))}
                value={form.eventType}
                onChange={handleChange}
                error={errors.eventType}
              />
            )}

            <div className="field-pair">
              <TextField
                label="Date"
                name="date"
                type="date"
                min={toDateInputValue(now)}
                max={toDateInputValue(addDays(now, RESERVATION_RULES.maxDaysAhead))}
                value={form.date}
                onChange={handleChange}
                error={errors.date}
              />
              <SelectField
                label="Time"
                name="time"
                options={timeOptions}
                value={form.time}
                onChange={handleChange}
                error={errors.time}
                hint={seatsLeft > 0 ? `${seatsLeft} seats left at this time` : 'This time is full'}
              />
            </div>

            <TextField
              label="Number of guests"
              name="partySize"
              type="number"
              min={limits.min}
              max={limits.max}
              value={form.partySize}
              onChange={handleChange}
              error={errors.partySize}
              hint={`${limits.min} to ${limits.max} guests`}
            />

            <h2>Contact details</h2>
            <TextField label="Full name" name="name" autoComplete="name" value={form.name} onChange={handleChange} error={errors.name} />
            <div className="field-pair">
              <TextField label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} error={errors.email} />
              <TextField label="Phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={handleChange} error={errors.phone} />
            </div>
            <TextAreaField
              label={isEvent ? 'Tell us about your event' : 'Special requests (optional)'}
              name="specialRequests"
              maxLength={500}
              placeholder={isEvent ? 'Cake, decorations, set menu, projector…' : 'High chair, window seat, allergies…'}
              value={form.specialRequests}
              onChange={handleChange}
              error={errors.specialRequests}
            />

            <button type="submit" className="button button--large button--block" disabled={submitting}>
              {submitting ? 'Booking…' : isEvent ? 'Send event request' : 'Book table'}
            </button>
          </form>
        )}

        <aside className="panel" aria-labelledby="my-bookings-title">
          <div className="panel__title">
            <h2 id="my-bookings-title">Your bookings</h2>
            {myBookings.some((reservation) => reservation.status === 'pending') && <span className="live-dot">Live</span>}
          </div>
          <ReservationList
            reservations={myBookings}
            onCancel={cancelBooking}
            emptyText="Bookings you make on this device show up here with their status."
          />
        </aside>
      </div>
    </div>
  )
}
