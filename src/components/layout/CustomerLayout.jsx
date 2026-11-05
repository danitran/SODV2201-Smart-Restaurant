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
