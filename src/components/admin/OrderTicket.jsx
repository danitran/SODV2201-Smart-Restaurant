import { NEXT_ORDER_STATUS } from '../../data/restaurantInfo.js'
import { formatPrice, timeAgo } from '../../utils/format.js'

const NEW_FOR_MS = 3 * 60_000

function actionLabel(next, type) {
  if (next === 'preparing') return 'Start preparing'
  if (next === 'ready') return type === 'pickup' ? 'Ready for pickup' : 'Send out for delivery'
  return type === 'pickup' ? 'Mark picked up' : 'Mark delivered'
}

export function OrderTicket({ order, now, busy, onAdvance, onCancel }) {
  const nextSteps = NEXT_ORDER_STATUS[order.status]
  const next = nextSteps.find((status) => status !== 'cancelled')
  const canCancel = nextSteps.includes('cancelled')
  const isNew = order.status === 'pending' && now.getTime() - new Date(order.createdAt).getTime() < NEW_FOR_MS

  return (
    <article className={`ticket ${isNew ? 'is-new' : ''}`} aria-label={`Order ${order.id}`}>
      <header className="ticket__head">
        <span className="ticket__id">{order.id}</span>
        {isNew ? <span className="tag-new">New</span> : <span className="muted small">{timeAgo(order.createdAt, now.getTime())}</span>}
      </header>
      <div className="ticket__meta">
        <strong>{order.type === 'pickup' ? 'Pickup' : 'Delivery'}</strong>
        <span>{order.customer.name}</span>
        <span>{order.customer.phone}</span>
      </div>
      {order.type === 'delivery' && <p className="small">{order.customer.address}</p>}

      <ul className="ticket__items">
        {order.items.map((line) => (
          <li key={line.itemId}>
            {line.quantity} × {line.name}
          </li>
        ))}
      </ul>
      {order.notes && <p className="ticket__notes">Note: {order.notes}</p>}

      <footer className="ticket__foot">
        <strong>{formatPrice(order.total)}</strong>
        <div className="ticket__actions">
          {canCancel && (
            <button type="button" className="button button--danger button--small" onClick={onCancel} disabled={busy}>
              Cancel
            </button>
          )}
          {next && (
            <button type="button" className="button button--small" onClick={() => onAdvance(next)} disabled={busy}>
              {actionLabel(next, order.type)}
            </button>
          )}
        </div>
      </footer>
    </article>
  )
}
