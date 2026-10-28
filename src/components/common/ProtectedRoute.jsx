/**
 * ProtectedRoute.jsx — wraps pages that need a signed-in user.
 *
 *   <ProtectedRoute>                 any signed-in user (customer account page)
 *   <ProtectedRoute role="admin">    admins only (dashboard)
 *
 * Guests are sent to /login. The page they wanted is passed along in the
 * router state (`from`), so after signing in they come straight back.
 * A customer who opens an admin URL sees an explanation instead.
 */
import { Link, Navigate, useLocation } from 'react-router'
import { useAuth } from '../../context/AuthContext.js'
import { EmptyState } from './Feedback.jsx'

export function ProtectedRoute({ role, children }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (role && user.role !== role) {
    return (
      <div className="container page">
        <EmptyState
          icon="🔒"
          title="This area is for restaurant staff"
          actions={
            <>
              <Link className="button" to="/login" state={{ from: location.pathname }} onClick={logout}>
                Sign in as admin
              </Link>
              <Link className="button button--secondary" to="/">
                Back to the restaurant
              </Link>
            </>
          }
        >
          You are signed in as {user.name}. Sign in with the admin account to manage the restaurant.
        </EmptyState>
      </div>
    )
  }

  return children
}
