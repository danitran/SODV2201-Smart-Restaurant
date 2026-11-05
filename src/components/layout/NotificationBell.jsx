import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext.js'
import { useRestaurant } from '../../context/RestaurantContext.js'
import { timeAgo } from '../../utils/format.js'
import { Icon } from '../common/Icon.jsx'

export function NotificationBell() {
  const { ownerId } = useAuth()
  const { notifications, markAllNotificationsRead } = useRestaurant()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  const mine = notifications.filter((notification) => notification.ownerId === ownerId)
  const unread = mine.filter((notification) => !notification.read).length

  useEffect(() => {
    if (!open) return undefined
    const handleClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false)
    }
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const toggle = () => {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen && unread > 0) markAllNotificationsRead(ownerId)
  }

  return (
    <div className="bell" ref={wrapperRef}>
      <button
        type="button"
        className="icon-button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      >
        <Icon name="bell" />
        {unread > 0 && <span className="bell__count">{unread}</span>}
      </button>

      {open && (
        <div className="bell__panel">
          <div className="bell__head">
            <h2>Notifications</h2>
            <span className="small muted">{mine.length} total</span>
          </div>
          {mine.length === 0 ? (
            <p className="bell__empty">Order and booking updates will show up here.</p>
          ) : (
            <ul className="bell__list">
              {mine.slice(0, 12).map((notification) => (
                <li key={notification.id}>
                  <Link
                    to={notification.link || '/'}
                    className={`bell__item ${notification.read ? '' : 'is-unread'}`}
                    onClick={() => setOpen(false)}
                  >
                    <strong>{notification.title}</strong>
                    {notification.message}
                    <span className="muted"> {timeAgo(notification.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
