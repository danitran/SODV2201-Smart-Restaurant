import { formatPrice } from '../../utils/format.js'
import { PRICING } from '../../data/restaurantInfo.js'

export function GuestCheck({ title, lines, totals, type, children }) {
  return (
    <section className="guest-check" aria-label={title}>
      <header className="guest-check__head">
        <span className="guest-check__brand">Basil &amp; Brick</span>
        <span>{title}</span>
      </header>

      <ul className="guest-check__lines">
        {lines.map((line) => (
          <li key={line.itemId}>
            <span className="guest-check__qty">{line.quantity}×</span>
            <span className="guest-check__name">{line.name}</span>
            <span className="guest-check__amount">{formatPrice(line.price * line.quantity)}</span>
          </li>
        ))}
      </ul>

      <dl className="guest-check__totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatPrice(totals.subtotal)}</dd>
        </div>
        <div>
          <dt>{type === 'pickup' ? 'Pickup' : 'Delivery'}</dt>
          <dd>{type === 'pickup' || totals.deliveryFee === 0 ? 'Free' : formatPrice(totals.deliveryFee)}</dd>
        </div>
        <div>
          <dt>GST ({Math.round(PRICING.taxRate * 100)}%)</dt>
          <dd>{formatPrice(totals.tax)}</dd>
        </div>
        <div className="guest-check__total">
          <dt>Total</dt>
          <dd>{formatPrice(totals.total)}</dd>
        </div>
      </dl>

      {children && <div className="guest-check__foot">{children}</div>}
    </section>
  )
}
