/**
 * AdminDashboard.jsx — today's numbers, sales charts and a customer feedback
 * summary, all calculated from the orders and reviews in RestaurantContext.
 *
 *   Stat tiles          orders and sales today, orders in the kitchen,
 *                       event requests waiting, average rating
 *   Period filter       "Last 7 days" (orders per day) or "Last 4 weeks"
 *                       (orders per week). It scopes everything below it.
 *   Most ordered        top 5 dishes in the period
 *   Customer feedback   star distribution, a written summary of what people
 *                       praise and complain about, and the latest comments
 *
 * "Reset demo data" puts the original sample data back (handy before
 * recording the demo video).
 */
import { useState } from 'react'
import { Link } from 'react-router'
import { useRestaurant } from '../../context/RestaurantContext.js'
import { useToast } from '../../context/ToastContext.js'
import { useNow } from '../../hooks/useNow.js'
import { getErrorMessage } from '../../services/apiError.js'
import {
  getFeedbackInLastDays,
  getOrdersInLastDays,
  getOrdersPerDay,
  getOrdersPerWeek,
  getPopularItems,
  getTodayStats,
  summarizeFeedback,
} from '../../utils/analytics.js'
import { formatDateTime, formatPrice, roundMoney } from '../../utils/format.js'
import { Stars } from '../../components/common/Badges.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { ConfirmDialog } from '../../components/common/Modal.jsx'
import { BarList, ColumnChart } from '../../components/admin/Charts.jsx'

const PERIODS = {
  week: { label: 'Last 7 days', days: 7 },
  month: { label: 'Last 4 weeks', days: 28 },
}

export default function AdminDashboard() {
  const { menu, orders, reservations, feedback, resetDemoData } = useRestaurant()
  const { showToast } = useToast()
  const now = useNow()
  const [period, setPeriod] = useState('week')
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)

  // ── Today (not affected by the period filter) ──
  const today = getTodayStats(orders, now)
  const waitingEvents = reservations.filter((reservation) => reservation.status === 'pending').length
  const allFeedback = summarizeFeedback(feedback)

  // ── Selected period ──
  const { days, label: periodLabel } = PERIODS[period]
  const periodOrders = getOrdersInLastDays(orders, days, now).filter((order) => order.status !== 'cancelled')
  const series = period === 'week' ? getOrdersPerDay(orders, 7, now) : getOrdersPerWeek(orders, 4, now)
  const periodSales = roundMoney(periodOrders.reduce((sum, order) => sum + order.total, 0))
  const topDishes = getPopularItems(periodOrders, menu, { limit: 5 })
  const reviews = summarizeFeedback(getFeedbackInLastDays(feedback, days, now))

  const handleReset = async () => {
    setResetting(true)
    try {
      await resetDemoData()
      showToast('The original demo data is back.')
    } catch (error) {
      showToast(getErrorMessage(error), { type: 'error' })
    } finally {
      setResetting(false)
      setConfirmReset(false)
    }
  }

  return (
    <div className="admin-page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>{now.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <button type="button" className="button button--secondary" onClick={() => setConfirmReset(true)}>
          <Icon name="refresh" size={16} /> Reset demo data
        </button>
      </header>

      <section className="stat-row" aria-label="Today">
        <div className="stat">
          <span className="stat__label">Orders today</span>
          <span className="stat__value">{today.ordersToday}</span>
          <span className="stat__note">{today.deliveryShare}% delivery</span>
        </div>
        <div className="stat">
          <span className="stat__label">Sales today</span>
          <span className="stat__value">{formatPrice(today.revenueToday)}</span>
          <span className="stat__note">Including GST and delivery</span>
        </div>
        <div className="stat">
          <span className="stat__label">Orders in the kitchen</span>
          <span className="stat__value">{today.activeOrders}</span>
          <Link to="/admin/orders">Open the kitchen board</Link>
        </div>
        <div className="stat">
          <span className="stat__label">Event requests waiting</span>
          <span className="stat__value">{waitingEvents}</span>
          <Link to="/admin/reservations">Review bookings</Link>
        </div>
        <div className="stat">
          <span className="stat__label">Average rating</span>
          <span className="stat__value">{allFeedback.count ? allFeedback.average.toFixed(1) : 'None yet'}</span>
          <span className="stat__note">{allFeedback.count} reviews in total</span>
        </div>
      </section>

      <div className="filter-row">
        <h2>Sales and feedback</h2>
        <div className="segmented" role="group" aria-label="Period">
          {Object.entries(PERIODS).map(([key, option]) => (
            <button key={key} type="button" aria-pressed={period === key} onClick={() => setPeriod(key)}>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dash-grid">
        <section className="panel" aria-labelledby="orders-chart-title">
          <h2 id="orders-chart-title">{period === 'week' ? 'Orders per day' : 'Orders per week'}</h2>
          <p className="chart-caption">
            {periodOrders.length} orders and {formatPrice(periodSales)} in sales, {periodLabel.toLowerCase()}. Cancelled
            orders are not counted.
          </p>
          <ColumnChart data={series} caption={`${period === 'week' ? 'Orders per day' : 'Orders per week'}, ${periodLabel}`} />
        </section>

        <section className="panel" aria-labelledby="top-dishes-title">
          <h2 id="top-dishes-title">Most ordered dishes</h2>
          <p className="chart-caption">Portions sold, {periodLabel.toLowerCase()}.</p>
          {topDishes.length ? (
            <BarList
              label="Most ordered dishes"
              items={topDishes.map((dish) => ({ id: dish.id, label: `${dish.emoji} ${dish.name}`, value: dish.quantity }))}
            />
          ) : (
            <p className="muted small">No orders in this period yet.</p>
          )}
        </section>
      </div>

      <section className="panel feedback-panel" aria-labelledby="feedback-title">
        <div className="panel__title">
          <h2 id="feedback-title">Customer feedback</h2>
          <span className="muted small">{periodLabel}</span>
        </div>
        {reviews.count === 0 ? (
          <p className="muted">No reviews in this period yet. Customers can rate an order once it is delivered.</p>
        ) : (
          <div className="feedback-grid">
            <div>
              <p className="rating-big">{reviews.average.toFixed(1)}</p>
              <p>
                <Stars value={reviews.average} /> <span className="muted small">{reviews.count} reviews</span>
              </p>
              <BarList
                label="Reviews per star rating"
                variant="rating"
                items={[5, 4, 3, 2, 1].map((stars) => ({ id: String(stars), label: `${stars} star${stars > 1 ? 's' : ''}`, value: reviews.distribution[stars] }))}
              />
            </div>
            <div>
              <h3>Summary</h3>
              <p>{reviews.summary}</p>
              {reviews.praise.length > 0 && (
                <>
                  <h3>Praised for</h3>
                  <ul className="theme-list">
                    {reviews.praise.map((theme) => (
                      <li key={theme.id} className="badge badge--diet">
                        {theme.label} ({theme.count})
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {reviews.complaints.length > 0 && (
                <>
                  <h3>Complaints about</h3>
                  <ul className="theme-list">
                    {reviews.complaints.map((theme) => (
                      <li key={theme.id} className="badge badge--spicy">
                        {theme.label} ({theme.count})
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <h3>Latest comments</h3>
              <ul className="quote-list">
                {reviews.recent.map((entry) => (
                  <li key={entry.id}>
                    <Stars value={entry.rating} /> “{entry.comment || 'No comment'}”
                    <br />
                    <span className="muted small">
                      {entry.name}, order {entry.orderId}, {formatDateTime(entry.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmReset}
        title="Reset all demo data?"
        message="Menu changes, new orders, bookings and accounts created during testing will be replaced by the original sample data."
        confirmLabel="Reset data"
        busy={resetting}
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  )
}
