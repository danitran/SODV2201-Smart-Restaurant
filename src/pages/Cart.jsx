import { Link } from 'react-router'
import { useCart } from '../context/CartContext.js'
import { PRICING } from '../data/restaurantInfo.js'
import { amountToFreeDelivery, calculateTotals } from '../utils/pricing.js'
import { formatPrice } from '../utils/format.js'
import { DishImage } from '../components/common/DishImage.jsx'
import { EmptyState } from '../components/common/Feedback.jsx'
import { Icon } from '../components/common/Icon.jsx'
import { QuantityStepper } from '../components/common/QuantityStepper.jsx'
import { GuestCheck } from '../components/orders/GuestCheck.jsx'
import { OrderTypePicker } from '../components/orders/OrderTypePicker.jsx'

export default function Cart() {
  const { lines, blockedLines, orderType, setOrderType, updateQuantity, removeItem, clearCart } = useCart()

  if (lines.length === 0) {
    return (
      <div className="container page">
        <EmptyState
          icon="🛍️"
          title="Your order is empty"
          actions={
            <Link className="button" to="/menu">
              Browse the menu
            </Link>
          }
        >
          Add dishes from the menu and they will show up here.
        </EmptyState>
      </div>
    )
  }

  const orderableLines = lines.filter((line) => line.isOrderable)
  const totals = calculateTotals(orderableLines, orderType)
  const toFreeDelivery = amountToFreeDelivery(totals.subtotal)
  const belowDeliveryMinimum = orderType === 'delivery' && totals.subtotal < PRICING.minDeliverySubtotal
  const canCheckout = blockedLines.length === 0 && !belowDeliveryMinimum

  return (
    <div className="container page">
      <header className="page-header">
        <div>
          <h1>Your order</h1>
          <p>Check your dishes and choose delivery or pickup.</p>
        </div>
        <button type="button" className="button button--ghost button--small" onClick={clearCart}>
          <Icon name="trash" size={16} /> Remove everything
        </button>
      </header>

      <div className="two-column">
        <div className="panel">
          {blockedLines.length > 0 && (
            <p className="form-banner" role="alert">
              {blockedLines.map((line) => line.name).join(', ')} {blockedLines.length === 1 ? 'is' : 'are'} no longer
              available. Remove {blockedLines.length === 1 ? 'it' : 'them'} to continue.
            </p>
          )}

          <ul className="cart-lines">
            {lines.map((line) => (
              <li key={line.itemId} className={`cart-line ${line.isOrderable ? '' : 'is-blocked'}`}>
                <DishImage item={line.item} className="dish-tile" sizes="56px" />
                <div className="cart-line__info">
                  {line.item ? <Link to={`/menu/${line.itemId}`}>{line.name}</Link> : <span>{line.name}</span>}
                  <span className="small muted">
                    {line.isOrderable ? `${formatPrice(line.price)} each` : 'Sold out right now'}
                  </span>
                </div>
                {line.isOrderable && (
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(quantity) => updateQuantity(line.itemId, quantity)}
                    min={1}
                    max={PRICING.maxQuantityPerItem}
                    label={line.name}
                  />
                )}
                <span className="cart-line__total">
                  {line.isOrderable ? formatPrice(line.price * line.quantity) : '—'}
                </span>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => removeItem(line.itemId)}
                  aria-label={`Remove ${line.name}`}
                >
                  <Icon name="trash" size={18} />
                </button>
              </li>
            ))}
          </ul>

          <OrderTypePicker value={orderType} onChange={setOrderType} />
          {orderType === 'delivery' && toFreeDelivery > 0 && !belowDeliveryMinimum && (
            <p className="hint-strip">Add {formatPrice(toFreeDelivery)} more for free delivery.</p>
          )}
          {belowDeliveryMinimum && (
            <p className="form-banner" role="alert">
              Delivery starts at a {formatPrice(PRICING.minDeliverySubtotal)} subtotal. Add more dishes or choose pickup.
            </p>
          )}
        </div>

        <GuestCheck title="Your order" lines={orderableLines} totals={totals} type={orderType}>
          {canCheckout ? (
            <Link className="button button--large button--block" to="/checkout">
              Go to checkout
            </Link>
          ) : (
            <button type="button" className="button button--large button--block" disabled>
              Go to checkout
            </button>
          )}
          <Link className="guest-check__more" to="/menu">
            Add more dishes
          </Link>
        </GuestCheck>
      </div>
    </div>
  )
}
