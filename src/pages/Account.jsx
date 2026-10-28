/**
 * Account.jsx — the signed-in customer's area (protected route).
 *
 *   Profile and preferences  name, phone, address, dietary needs. The menu
 *                            can apply these, and the AI assistant uses them
 *                            for recommendations.
 *   Order history            every order with its status, plus "Order again"
 *   Bookings                 reservations with live status and cancel
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext.js'
import { useCart } from '../context/CartContext.js'
import { useRestaurant } from '../context/RestaurantContext.js'
import { useToast } from '../context/ToastContext.js'
import { DIETARY_TAGS } from '../data/restaurantInfo.js'
import { getErrorMessage } from '../services/apiError.js'
import { formatDateTime, formatPrice } from '../utils/format.js'
import { focusFirstError } from '../utils/dom.js'
import { hasErrors, validateProfile } from '../utils/validation.js'
import { StatusBadge } from '../components/common/Badges.jsx'
import { EmptyState } from '../components/common/Feedback.jsx'
import { TextField } from '../components/common/FormFields.jsx'
import { ReservationList } from '../components/reservations/ReservationList.jsx'

function ProfileForm({ user, onSave }) {
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone ?? '',
    address: user.address ?? '',
    dietary: user.preferences?.dietary ?? [],
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const toggleDiet = (dietId) =>
    setForm((current) => ({
      ...current,
      dietary: current.dietary.includes(dietId)
        ? current.dietary.filter((diet) => diet !== dietId)
        : [...current.dietary, dietId],
    }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = validateProfile(form)
    setErrors(found)
    if (hasErrors(found)) {
      focusFirstError(found)
      return
    }
    setSaving(true)
    try {
      await onSave({ name: form.name, phone: form.phone, address: form.address, preferences: { dietary: form.dietary } })
    } catch (error) {
      setErrors(error.fieldErrors ?? {})
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <TextField label="Full name" name="name" value={form.name} onChange={handleChange} error={errors.name} />
      <div className="field-pair">
        <TextField label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} error={errors.phone} />
        <TextField label="Email" name="email" type="email" value={user.email} disabled hint="Email cannot be changed." />
      </div>
      <TextField label="Delivery address" name="address" value={form.address} onChange={handleChange} hint="Filled in for you at checkout." />
      <fieldset className="field">
        <legend>Dietary preferences</legend>
        <p className="field__hint">Used by the menu filters and the AI assistant&apos;s recommendations.</p>
        <div className="choice-row">
          {DIETARY_TAGS.map((tag) => (
            <label key={tag.id} className="choice">
              <input type="checkbox" checked={form.dietary.includes(tag.id)} onChange={() => toggleDiet(tag.id)} />
              {tag.label}
            </label>
          ))}
        </div>
      </fieldset>
      <button type="submit" className="button" disabled={saving}>
        {saving ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}

export default function Account() {
  const { user, saveProfile } = useAuth()
  const { orders, reservations, updateReservationStatus } = useRestaurant()
  const { addItem } = useCart()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const myOrders = orders
    .filter((order) => order.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const myBookings = reservations.filter((reservation) => reservation.userId === user.id || reservation.ownerId === user.id)

  const handleSave = async (changes) => {
    try {
      await saveProfile(changes)
      showToast('Your profile was saved.')
    } catch (error) {
      showToast(getErrorMessage(error), { type: 'error' })
      throw error
    }
  }

  const orderAgain = (order) => {
    order.items.forEach((line) => addItem(line.itemId, line.quantity))
    showToast(`Dishes from ${order.id} were added to your order.`)
    navigate('/cart')
  }

  const cancelBooking = async (reservation) => {
    try {
      await updateReservationStatus(reservation.id, 'cancelled', 'customer')
      showToast(`Booking ${reservation.id} was cancelled.`, { type: 'info' })
    } catch (error) {
      showToast(getErrorMessage(error), { type: 'error' })
    }
  }

  return (
    <div className="container page">
      <header className="page-header">
        <div>
          <h1>Hi, {user.name.split(' ')[0]}</h1>
          <p>Your profile, past orders and bookings in one place.</p>
        </div>
      </header>

      <div className="two-column">
        <div>
          <section className="panel" aria-labelledby="history-title">
            <div className="panel__title">
              <h2 id="history-title">Order history</h2>
              <span className="muted small">{myOrders.length} orders</span>
            </div>
            {myOrders.length === 0 ? (
              <EmptyState icon="🧾" title="No orders yet" actions={<Link className="button" to="/menu">Browse the menu</Link>}>
                Orders you place while signed in will be listed here.
              </EmptyState>
            ) : (
              <ul className="history-list">
                {myOrders.map((order) => (
                  <li key={order.id} className="history-item">
                    <div className="history-item__main">
                      <Link to={`/orders/${order.id}`} className="history-item__id">
                        {order.id}
                      </Link>
                      <span className="muted small">
                        {formatDateTime(order.createdAt)}, {order.type}
                      </span>
                      <span className="history-item__dishes">
                        {order.items.map((line) => `${line.quantity} × ${line.name}`).join(', ')}
                      </span>
                    </div>
                    <div className="history-item__side">
                      <StatusBadge kind="order" status={order.status} type={order.type} />
                      <strong>{formatPrice(order.total)}</strong>
                      <button type="button" className="button button--secondary button--small" onClick={() => orderAgain(order)}>
                        Order again
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel" aria-labelledby="account-bookings-title">
            <div className="panel__title">
              <h2 id="account-bookings-title">Bookings</h2>
              <Link to="/reservations" className="small">
                Book a table
              </Link>
            </div>
            <ReservationList reservations={myBookings} onCancel={cancelBooking} emptyText="You have no bookings yet." />
          </section>
        </div>

        <section className="panel" aria-labelledby="profile-title">
          <h2 id="profile-title">Profile and preferences</h2>
          <ProfileForm user={user} onSave={handleSave} />
        </section>
      </div>
    </div>
  )
}
