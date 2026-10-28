/**
 * Checkout.jsx — contact details, delivery address and placing the order.
 *
 * The form is controlled: one `form` state object holds every field, and
 * handleChange() updates the field whose `name` matches the input.
 *
 * Submitting:
 *   1. validateCheckout() checks the form in the browser (instant feedback)
 *   2. placeOrder() sends it to the order service, which checks it again,
 *      re-prices the dishes and saves the order
 *   3. on success: clear the cart and go to the tracking page
 *      on failure: show the service's message and highlight the fields
 */
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext.js'
import { useCart } from '../context/CartContext.js'
import { useRestaurant } from '../context/RestaurantContext.js'
import { useToast } from '../context/ToastContext.js'
import { getErrorMessage } from '../services/apiError.js'
import { calculateTotals } from '../utils/pricing.js'
import { focusFirstError } from '../utils/dom.js'
import { hasErrors, validateCheckout } from '../utils/validation.js'
import { Spinner } from '../components/common/Feedback.jsx'
import { TextAreaField, TextField } from '../components/common/FormFields.jsx'
import { GuestCheck } from '../components/orders/GuestCheck.jsx'
import { OrderTypePicker } from '../components/orders/OrderTypePicker.jsx'

export default function Checkout() {
  const { user, ownerId } = useAuth()
  const { lines, blockedLines, orderType, setOrderType, clearCart } = useCart()
  const { placeOrder } = useRestaurant()
  const { showToast } = useToast()
  const navigate = useNavigate()

  // Signed-in customers get their saved details filled in.
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    address: user?.address ?? '',
    notes: '',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Set after a successful order. Clearing the cart re-renders this page with
  // an empty cart before the router moves on, and this flag stops the
  // "empty cart → back to /cart" redirect below from winning that race.
  const [placedOrderId, setPlacedOrderId] = useState(null)

  if (placedOrderId) {
    return (
      <div className="container page">
        <Spinner label={`Opening order ${placedOrderId}…`} />
      </div>
    )
  }

  // Nothing to check out (or dishes need removing): go back to the cart.
  if (lines.length === 0 || blockedLines.length > 0) return <Navigate to="/cart" replace />

  const totals = calculateTotals(lines, orderType)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    // Clear a field's error as soon as the user edits it.
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const found = validateCheckout({ ...form, type: orderType }, { subtotal: totals.subtotal })
    if (hasErrors(found)) {
      setErrors(found)
      setFormError('Please fix the highlighted fields.')
      focusFirstError(found)
      return
    }

    setSubmitting(true)
    try {
      const order = await placeOrder({
        ownerId,
        userId: user?.id ?? null,
        customer: { name: form.name, phone: form.phone, email: form.email, address: form.address },
        type: orderType,
        items: lines.map((line) => ({ itemId: line.itemId, quantity: line.quantity })),
        notes: form.notes,
      })
      setPlacedOrderId(order.id)
      clearCart()
      showToast(`Order ${order.id} is confirmed.`, { title: 'Thank you!' })
      navigate(`/orders/${order.id}`, { state: { justPlaced: true } })
    } catch (error) {
      setErrors(error.fieldErrors ?? {})
      setFormError(getErrorMessage(error))
      setSubmitting(false)
      focusFirstError(error.fieldErrors ?? {})
    }
  }

  return (
    <div className="container page">
      <header className="page-header">
        <div>
          <h1>Checkout</h1>
          <p>
            Pay when your order arrives or when you pick it up (card or cash).
            {!user && (
              <>
                {' '}
                <Link to="/login" state={{ from: '/checkout' }}>
                  Sign in
                </Link>{' '}
                to save this order to your history.
              </>
            )}
          </p>
        </div>
      </header>

      <div className="two-column">
        <form className="panel" onSubmit={handleSubmit} noValidate>
          {formError && (
            <p className="form-banner" role="alert">
              {formError}
            </p>
          )}

          <OrderTypePicker value={orderType} onChange={setOrderType} error={errors.type} />

          <h2>Your details</h2>
          <TextField label="Full name" name="name" autoComplete="name" value={form.name} onChange={handleChange} error={errors.name} />
          <div className="field-pair">
            <TextField label="Phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={handleChange} error={errors.phone} hint="We call or text if there is a problem." />
            <TextField label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} error={errors.email} />
          </div>

          {orderType === 'delivery' && (
            <TextField
              label="Delivery address"
              name="address"
              autoComplete="street-address"
              placeholder="Street, unit, city"
              value={form.address}
              onChange={handleChange}
              error={errors.address}
            />
          )}

          <TextAreaField
            label="Notes for the kitchen or driver (optional)"
            name="notes"
            maxLength={300}
            placeholder="Allergies, buzzer code, extra napkins…"
            value={form.notes}
            onChange={handleChange}
            error={errors.notes}
            hint={`${form.notes.length}/300 characters`}
          />

          <button type="submit" className="button button--large button--block" disabled={submitting}>
            {submitting ? 'Placing your order…' : 'Place order'}
          </button>
        </form>

        <GuestCheck title="Your order" lines={lines} totals={totals} type={orderType}>
          <Link className="guest-check__more" to="/cart">
            Change dishes
          </Link>
        </GuestCheck>
      </div>
    </div>
  )
}
