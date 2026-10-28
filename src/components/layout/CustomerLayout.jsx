/**
 * CustomerLayout.jsx — the frame around every customer page.
 *
 * React Router renders the current page where <Outlet /> is. The header,
 * footer and the update watcher stay mounted while pages change.
 *
 * Also inside:
 *   - ChatWidget: the AI assistant, available on every customer page
 *   - ScrollToTop: jump to the top when the URL changes
 *   - UpdateWatcher: pops up a toast when the restaurant changes one of this
 *     customer's orders or bookings (for example from the admin tab)
 */
import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useAuth } from '../../context/AuthContext.js'
import { useRestaurant } from '../../context/RestaurantContext.js'
import { useToast } from '../../context/ToastContext.js'
import { ChatWidget } from '../chat/ChatWidget.jsx'
import { ErrorBoundary } from '../common/ErrorBoundary.jsx'
import { Footer } from './Footer.jsx'
import { Navbar } from './Navbar.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function UpdateWatcher() {
  const { ownerId } = useAuth()
  const { notifications } = useRestaurant()
  const { showToast } = useToast()
  // Ids we have already seen. Starts with everything that existed on load,
  // so old notifications do not pop up again.
  const seen = useRef(null)

  useEffect(() => {
    if (seen.current === null) {
      seen.current = new Set(notifications.map((notification) => notification.id))
      return
    }
    for (const notification of notifications) {
      if (seen.current.has(notification.id)) continue
      seen.current.add(notification.id)
      if (notification.ownerId === ownerId && notification.source === 'restaurant') {
        showToast(notification.message, { type: 'info', title: notification.title })
      }
    }
  }, [notifications, ownerId, showToast])

  return null
}

export function CustomerLayout() {
  const { pathname } = useLocation()
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ScrollToTop />
      <UpdateWatcher />
      <Navbar />
      <main id="main" className="site-main">
        <ErrorBoundary key={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <ChatWidget />
    </>
  )
}
