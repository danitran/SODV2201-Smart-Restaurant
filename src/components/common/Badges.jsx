/**
 * Badges.jsx — little labels used across the app.
 *
 *   <StatusBadge kind="order" status="preparing" type="pickup" />
 *   <StatusBadge kind="reservation" status="pending" />
 *   <DishBadges item={menuItem} />   dietary tags, spicy, special, sold out
 *   <Stars value={4} />              read-only star rating
 */
import { DIETARY_TAGS } from '../../data/restaurantInfo.js'
import { getStatusLabel } from '../../services/orderService.js'

const RESERVATION_LABELS = {
  pending: 'Awaiting approval',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
}

export function StatusBadge({ kind = 'order', status, type }) {
  const label = kind === 'order' ? getStatusLabel(status, type) : RESERVATION_LABELS[status]
  return <span className={`status status--${status}`}>{label}</span>
}

/**
 * Props:
 *   item         the menu item
 *   showSpecial  show the "Today's special" badge (default true)
 */
export function DishBadges({ item, showSpecial = true }) {
  const tags = DIETARY_TAGS.filter((tag) => item.dietary.includes(tag.id))
  const hasAny = tags.length > 0 || item.spicy || (showSpecial && item.isSpecial) || !item.available
  if (!hasAny) return null

  return (
    <div className="badge-row">
      {!item.available && <span className="badge badge--soldout">Sold out</span>}
      {showSpecial && item.isSpecial && <span className="badge badge--special">Today&apos;s special</span>}
      {tags.map((tag) => (
        <span key={tag.id} className="badge badge--diet" title={tag.label}>
          {tag.label}
        </span>
      ))}
      {item.spicy && <span className="badge badge--spicy">Spicy</span>}
    </div>
  )
}

export function Stars({ value }) {
  const rounded = Math.round(value)
  return (
    <span className="stars" aria-label={`${value} out of 5 stars`} role="img">
      {'★'.repeat(rounded)}
      <span className="stars__off">{'★'.repeat(5 - rounded)}</span>
    </span>
  )
}
