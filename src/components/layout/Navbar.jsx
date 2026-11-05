import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext.js'
import { useCart } from '../../context/CartContext.js'
import { useToast } from '../../context/ToastContext.js'
import { Icon, LogoMark } from '../common/Icon.jsx'
import { NotificationBell } from './NotificationBell.jsx'

export function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const { itemCount } = useCart()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  const handleLogout = () => {
    logout()
    showToast('You are signed out.', { type: 'info' })
    navigate('/')
  }

  return (
    <header className="site-header">
      <div className="site-header__inner container">
        <Link to="/" className="brand" onClick={closeMenu}>
          <LogoMark />
          <span className="brand__name">Basil &amp; Brick</span>
        </Link>

        <nav id="site-nav" className={`site-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main">
          <NavLink to="/menu" onClick={closeMenu}>
            Menu
          </NavLink>
          <NavLink to="/reservations" onClick={closeMenu}>
            Reservations
          </NavLink>
          {user && !isAdmin && (
            <NavLink to="/account" onClick={closeMenu}>
              My account
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" onClick={closeMenu}>
              Admin dashboard
            </NavLink>
          )}
        </nav>

        <div className="site-header__actions">
          <NotificationBell />
          <Link to="/cart" className="cart-link" aria-label={`Your order, ${itemCount} items`} onClick={closeMenu}>
            <Icon name="bag" size={18} />
            <span className="cart-link__label">Your order</span>
            <span className="cart-link__count">{itemCount}</span>
          </Link>
          {user ? (
            <div className="user-chip">
              <span className="user-chip__name" title={user.email}>
                {user.name.split(' ')[0]}
              </span>
              <button type="button" className="icon-button" onClick={handleLogout} aria-label="Sign out">
                <Icon name="logout" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="button button--secondary button--small">
              Sign in
            </Link>
          )}
        </div>

        <button
          type="button"
          className="icon-button nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="site-nav"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} />
        </button>
      </div>
    </header>
  )
}
