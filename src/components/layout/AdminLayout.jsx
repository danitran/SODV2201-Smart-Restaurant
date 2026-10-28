/**
 * AdminLayout.jsx — the frame around the admin pages: a sidebar with links
 * and counters, and the current page in <Outlet />.
 *
 * NewActivityWatcher pops up a toast when a customer places an order or
 * books a table (for example in another browser tab), so staff notice new
 * work without refreshing.
 */
import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext.js'
import { useRestaurant } from '../../context/RestaurantContext.js'
import { useToast } from '../../context/ToastContext.js'
import { describeBooking } from '../../services/reservationService.js'
import { formatDate, formatPrice, formatTime } from '../../utils/format.js'
import { ErrorBoundary } from '../common/ErrorBoundary.jsx'
import { Icon, LogoMark } from '../common/Icon.jsx'

function NewActivityWatcher() {
  const { orders, reservations } = useRestaurant()
  const { showToast } = useToast()
  const seen = useRef(null)

  useEffect(() => {
    const ids = [...orders.map((order) => order.id), ...reservations.map((reservation) => reservation.id)]
    if (seen.current === null) {
      seen.current = new Set(ids)
      return
    }
    for (const order of orders) {
      if (seen.current.has(order.id)) continue
      seen.current.add(order.id)
      showToast(`${order.id}: ${order.items.length} dishes, ${formatPrice(order.total)}, ${order.type}.`, {
        type: 'info',
        title: 'New order',
      })
    }
    for (const reservation of reservations) {
      if (seen.current.has(reservation.id)) continue
      seen.current.add(reservation.id)
      showToast(`${describeBooking(reservation)} on ${formatDate(reservation.date)} at ${formatTime(reservation.time)}.`, {
        type: 'info',
        title: reservation.type === 'event' ? 'New event request' : 'New table booking',
      })
    }
  }, [orders, reservations, showToast])

  return null
}

export function AdminLayout() {
  const { user, logout } = useAuth()
  const { orders, reservations } = useRestaurant()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const newOrders = orders.filter((order) => order.status === 'pending').length
  const waitingEvents = reservations.filter((reservation) => reservation.status === 'pending').length

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="admin-shell">
      <NewActivityWatcher />
      <aside className="admin-sidebar">
        <Link to="/admin" className="brand">
          <LogoMark />
          <span className="brand__name">Basil &amp; Brick</span>
        </Link>
        <p className="admin-sidebar__label">Staff dashboard</p>

        <nav className="admin-nav" aria-label="Admin">
          <NavLink to="/admin" end>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/orders">
            <span>Orders</span>
            {newOrders > 0 && (
              <span className="admin-nav__count" aria-label={`${newOrders} new`}>
                {newOrders}
              </span>
            )}
          </NavLink>
          <NavLink to="/admin/reservations">
            <span>Reservations</span>
            {waitingEvents > 0 && (
              <span className="admin-nav__count" aria-label={`${waitingEvents} waiting for approval`}>
                {waitingEvents}
              </span>
            )}
          </NavLink>
          <NavLink to="/admin/menu">
            <span>Menu</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar__footer">
          <Link to="/">View the restaurant site</Link>
          <span className="admin-sidebar__label">Signed in as {user.name}</span>
          <button type="button" className="link-button" onClick={handleLogout}>
            <Icon name="logout" size={16} /> Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main" id="main">
        <ErrorBoundary key={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}
