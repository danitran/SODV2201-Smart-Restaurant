/**
 * OrderTracker.jsx — the step-by-step progress of an order:
 *   Order received → Preparing → Ready → Delivered (or Picked up)
 *
 * The current step comes from order.status, and the time under each step
 * comes from order.statusHistory. When the admin changes the status, the
 * order in RestaurantContext changes and this component re-renders on its own.
 */
import { ORDER_FLOW } from '../../data/restaurantInfo.js'
import { getStatusLabel } from '../../services/orderService.js'
import { formatDateTime } from '../../utils/format.js'

export function OrderTracker({ order }) {
  if (order.status === 'cancelled') {
    return (
      <p className="form-banner" role="status">
        This order was cancelled. You have not been charged.
      </p>
    )
  }

  const currentIndex = ORDER_FLOW.indexOf(order.status)
  const timeOf = (status) => order.statusHistory.find((entry) => entry.status === status)?.at

  return (
    <ol className="tracker" aria-label="Order progress">
      {ORDER_FLOW.map((status, index) => {
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming'
        const at = timeOf(status)
        return (
          <li key={status} className={`tracker__step is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="tracker__dot" aria-hidden="true">
              {index < currentIndex || (state === 'current' && status === 'delivered') ? '✓' : index + 1}
            </span>
            <span className="tracker__label">{getStatusLabel(status, order.type)}</span>
            <span className="tracker__time">{at ? formatDateTime(at) : 'Waiting'}</span>
          </li>
        )
      })}
    </ol>
  )
}
