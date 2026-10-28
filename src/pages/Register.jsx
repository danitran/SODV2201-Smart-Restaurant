/**
 * Register.jsx — create a customer account (controlled form).
 * The new customer is signed in straight away.
 */
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext.js'
import { useToast } from '../context/ToastContext.js'
import { getErrorMessage } from '../services/apiError.js'
import { focusFirstError } from '../utils/dom.js'
import { hasErrors, validateRegistration } from '../utils/validation.js'
import { TextField } from '../components/common/FormFields.jsx'

export default function Register() {
  const { user, register } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user && !submitting) return <Navigate to="/account" replace />

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = validateRegistration(form)
    if (hasErrors(found)) {
      setErrors(found)
      setFormError('Please fix the highlighted fields.')
      focusFirstError(found)
      return
    }
    setSubmitting(true)
    try {
      const account = await register(form)
      showToast(`Welcome, ${account.name.split(' ')[0]}! Your account is ready.`)
      navigate(location.state?.from ?? '/account', { replace: true })
    } catch (error) {
      setErrors(error.fieldErrors ?? {})
      setFormError(getErrorMessage(error))
      setSubmitting(false)
      focusFirstError(error.fieldErrors ?? {})
    }
  }

  return (
    <div className="container page auth-page">
      <form className="panel auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Create an account</h1>
        <p className="muted">Accounts are optional. They keep your order history, bookings and dietary preferences.</p>

        {formError && (
          <p className="form-banner" role="alert">
            {formError}
          </p>
        )}

        <TextField label="Full name" name="name" autoComplete="name" value={form.name} onChange={handleChange} error={errors.name} />
        <TextField label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} error={errors.email} />
        <TextField label="Phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={handleChange} error={errors.phone} />
        <TextField label="Password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={handleChange} error={errors.password} hint="At least 6 characters." />
        <TextField label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />

        <button type="submit" className="button button--large button--block" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
        <p className="small auth-card__switch">
          Already have an account? <Link to="/login" state={location.state}>Sign in</Link>
        </p>
      </form>
    </div>
  )
}
