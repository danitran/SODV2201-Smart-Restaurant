import { useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext.js'
import { useToast } from '../context/ToastContext.js'
import { DEMO_ACCOUNTS } from '../data/restaurantInfo.js'
import { getErrorMessage } from '../services/apiError.js'

export default function Login() {
  const { user, login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  // Uncontrolled inputs: values are read through refs on submit.
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const homeFor = (account) => location.state?.from ?? (account.role === 'admin' ? '/admin' : '/account')

  if (user && !submitting) return <Navigate to={homeFor(user)} replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    const email = emailRef.current.value
    const password = passwordRef.current.value
    if (!email || !password) {
      setError('Enter your email and password.')
      const emptyField = email ? passwordRef : emailRef
      emptyField.current.focus()
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const account = await login(email, password)
      showToast(`Welcome back, ${account.name.split(' ')[0]}!`)
      navigate(homeFor(account), { replace: true })
    } catch (loginError) {
      setError(getErrorMessage(loginError))
      setSubmitting(false)
      passwordRef.current.select()
    }
  }

  const fillDemo = (account) => {
    emailRef.current.value = account.email
    passwordRef.current.value = account.password
    setError('')
  }

  return (
    <div className="container page auth-page">
      <form className="panel auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Sign in</h1>
        <p className="muted">Save your preferences, see past orders and manage bookings. Staff sign in here too.</p>

        {error && (
          <p className="form-banner" role="alert">
            {error}
          </p>
        )}

        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" ref={emailRef} type="email" autoComplete="email" defaultValue="" />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input id="login-password" ref={passwordRef} type="password" autoComplete="current-password" defaultValue="" />
        </div>

        <button type="submit" className="button button--large button--block" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="small auth-card__switch">
          New here? <Link to="/register" state={location.state}>Create an account</Link>. You can also order and book
          as a guest.
        </p>

        <div className="demo-accounts">
          <p className="small">
            <strong>Demo accounts</strong> for testing this project:
          </p>
          <div className="demo-accounts__buttons">
            <button type="button" className="button button--secondary button--small" onClick={() => fillDemo(DEMO_ACCOUNTS.customer)}>
              Use customer ({DEMO_ACCOUNTS.customer.email})
            </button>
            <button type="button" className="button button--secondary button--small" onClick={() => fillDemo(DEMO_ACCOUNTS.admin)}>
              Use admin ({DEMO_ACCOUNTS.admin.email})
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
