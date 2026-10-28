/**
 * Footer.jsx — restaurant contact details, quick links and project credit.
 */
import { Link } from 'react-router'
import { RESTAURANT } from '../../data/restaurantInfo.js'
import { LogoMark } from '../common/Icon.jsx'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div>
            <Link to="/" className="brand">
              <LogoMark />
              <span className="brand__name">{RESTAURANT.name}</span>
            </Link>
            <p className="small site-footer__about">
              {RESTAURANT.tagline}. Order for delivery or pickup, or book a table for dinner and celebrations.
            </p>
          </div>
          <div>
            <h2>Visit us</h2>
            <ul>
              <li>{RESTAURANT.address}</li>
              <li>{RESTAURANT.phone}</li>
              <li>{RESTAURANT.hoursLabel}</li>
            </ul>
          </div>
          <div>
            <h2>Quick links</h2>
            <ul>
              <li>
                <Link to="/menu">Menu and online ordering</Link>
              </li>
              <li>
                <Link to="/reservations">Book a table or event</Link>
              </li>
              <li>
                <Link to="/admin">Staff dashboard</Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="site-footer__note">
          SODV2201 Final Project, Assignment 1: Smart Restaurant Management System by Tai Tran. Basil &amp; Brick is a
          fictional restaurant; orders and bookings are stored in your browser.
        </p>
      </div>
    </footer>
  )
}
