import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { useCart } from '../context/CartContext.js'
import { useRestaurant } from '../context/RestaurantContext.js'
import { useToast } from '../context/ToastContext.js'
import { formatDateTime } from '../utils/format.js'
import { StatusBadge, Stars } from '../components/common/Badges.jsx'
import { EmptyState } from '../components/common/Feedback.jsx'
import { FeedbackForm } from '../components/orders/FeedbackForm.jsx'
import { GuestCheck } from '../components/orders/GuestCheck.jsx'
import { OrderTracker } from '../components/orders/OrderTracker.jsx'

export default function OrderStatus() {
  const { orderId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { orders, feedback, submitFeedback } = useRestaurant()
  const { addItem } = useCart()
  const { showToast } = useToast()

  const order = orders.find((candidate) => candidate.id === orderId)

  if (!order) {
    return (
      <div className="container page">
        <EmptyState
          icon="ticket"
          title={`We could not find order ${orderId}`}
          actions={
            <Link className="button" to="/menu">
              Start a new order
            </Link>
          }
        >
          Check the order number in your notifications, or sign in to see your order history.
        </EmptyState>
      </div>
    )
  }

  const review = feedback.find((entry) => entry.id === order.feedbackId)
  const isActive = ['pending', 'preparing', 'ready'].includes(order.status)

  const handleFeedback = async (values) => {
    await submitFeedback(order.id, values)
    showToast('Thanks for your feedback!')
  }

  const orderAgain = () => {
    order.items.forEach((line) => addItem(line.itemId, line.quantity))
    showToast('The same dishes were added to your order.')
    navigate('/cart')
  }

  return (
    <div className="container page">
      {state?.justPlaced && (
        <p className="form-banner form-banner--info" role="status">
          Thank you! Your order is confirmed. Keep this page open to follow it live.
        </p>
      )}

      <header className="page-header">
        <div>
          <h1>Order {order.id}</h1>
          <p>
            Placed {formatDateTime(order.createdAt)} for {order.type === 'pickup' ? 'pickup' : 'delivery'}.
          </p>
        </div>
        <div className="order-head-status">
          <StatusBadge kind="order" status={order.status} type={order.type} />
          {isActive && <span className="live-dot">Live updates</span>}
        </div>
      </header>

      <div className="two-column">
        <div>
          <section className="panel" aria-labelledby="progress-title">
            <h2 id="progress-title">Progress</h2>
            <OrderTracker order={order} />
          </section>

          <section className="panel" aria-labelledby="details-title">
            <h2 id="details-title">Details</h2>
            <dl className="details-list">
              <div>
                <dt>Name</dt>
                <dd>{order.customer.name}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{order.customer.phone}</dd>
              </div>
              <div>
                <dt>{order.type === 'pickup' ? 'Pickup from' : 'Deliver to'}</dt>
                <dd>{order.type === 'pickup' ? 'Basil & Brick, 1208 Brickyard Lane SW' : order.customer.address}</dd>
              </div>
              {order.notes && (
                <div>
                  <dt>Notes</dt>
                  <dd>{order.notes}</dd>
                </div>
              )}
            </dl>
          </section>

          {order.status === 'delivered' && (
            <section className="panel" aria-labelledby="feedback-title">
              <h2 id="feedback-title">Your feedback</h2>
              {review ? (
                <p>
                  You rated this order <Stars value={review.rating} />
                  {review.comment && <> and said: “{review.comment}”</>}
                </p>
              ) : (
                <FeedbackForm onSubmit={handleFeedback} />
              )}
            </section>
          )}
        </div>

        <GuestCheck title={`Order ${order.id}`} lines={order.items} totals={order} type={order.type}>
          <button type="button" className="button button--secondary button--block" onClick={orderAgain}>
            Order the same again
          </button>
        </GuestCheck>
      </div>
    </div>
  )
}
