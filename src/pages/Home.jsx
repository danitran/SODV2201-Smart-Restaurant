import { Link } from 'react-router'
import { useCart } from '../context/CartContext.js'
import { useRestaurant } from '../context/RestaurantContext.js'
import { useToast } from '../context/ToastContext.js'
import { PRICING, RESTAURANT } from '../data/restaurantInfo.js'
import { useTilt } from '../hooks/useTilt.js'
import { getPopularItems } from '../utils/analytics.js'
import { formatPrice } from '../utils/format.js'
import { DishImage } from '../components/common/DishImage.jsx'
import { Icon } from '../components/common/Icon.jsx'
import { DishCard } from '../components/menu/DishCard.jsx'

function SpecialFeature({ dish, isSpecial, onAdd }) {
  const stageRef = useTilt(9)
  if (!dish) return null
  return (
    <figure className="special">
      <div ref={stageRef} className="special__stage tilt">
        <Link to={`/menu/${dish.id}`} className="special__media gilt-frame glare" tabIndex={-1} aria-hidden="true" data-cursor="view">
          <DishImage item={dish} loading="eager" sizes="(max-width: 900px) 92vw, 480px" />
        </Link>
        <span className="special__price">{formatPrice(dish.price)}</span>
      </div>
      <figcaption className="special__caption">
        <p className="special__label">{isSpecial ? "Today's special" : "Chef's pick"}</p>
        <h2 className="special__name">{dish.name}</h2>
        <p className="special__text">{dish.description}</p>
        <div className="special__actions">
          <button type="button" className="button" onClick={() => onAdd(dish)} disabled={!dish.available}>
            {dish.available ? 'Add to order' : 'Sold out today'}
          </button>
          <Link to={`/menu/${dish.id}`}>Ingredients and details</Link>
        </div>
      </figcaption>
    </figure>
  )
}

export default function Home() {
  const { menu, orders } = useRestaurant()
  const { addItem, getQuantity } = useCart()
  const { showToast } = useToast()

  const popular = getPopularItems(orders, menu, { limit: 4 })
  const special = menu.find((item) => item.isSpecial)

  const handleAdd = (dish) => {
    addItem(dish.id)
    showToast(`${dish.name} was added to your order.`)
  }

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__intro">
            <h1 className="hero__title">Wood-fired Italian, cooked to order.</h1>
            <p className="hero__lead">
              Order dinner for delivery or pickup, book a table, or plan a birthday or team lunch with us. Not sure what
              to pick? Ask our assistant in the corner of the screen.
            </p>
            <div className="hero__actions">
              <Link className="button button--large" to="/menu">
                Order online
              </Link>
              <Link className="button button--secondary button--large" to="/reservations">
                Book a table
              </Link>
            </div>
            <ul className="hero__facts">
              <li>
                <Icon name="clock" size={18} /> {RESTAURANT.hoursLabel}
              </li>
              <li>
                <Icon name="pin" size={18} /> {RESTAURANT.address}
              </li>
              <li>
                <Icon name="bag" size={18} /> Free delivery on orders over {formatPrice(PRICING.freeDeliveryOver)}
              </li>
            </ul>
          </div>
          <SpecialFeature dish={special ?? popular[0]} isSpecial={Boolean(special)} onAdd={handleAdd} />
        </div>
      </section>

      <section className="container home-section" aria-labelledby="popular-title">
        <div className="section-head">
          <h2 id="popular-title">Most ordered this month</h2>
          <Link to="/menu">See the full menu</Link>
        </div>
        <ol className="popular-grid">
          {popular.map((dish) => (
            <li key={dish.id}>
              <DishCard
                item={dish}
                compact
                meta={`Ordered ${dish.quantity} times`}
                inCart={getQuantity(dish.id)}
                onAdd={handleAdd}
              />
            </li>
          ))}
        </ol>
      </section>

      <section className="container home-section home-info" aria-label="How we can help">
        <div>
          <h2>Delivery or pickup</h2>
          <p>
            Delivery is {formatPrice(PRICING.deliveryFee)}, free over {formatPrice(PRICING.freeDeliveryOver)}. Track
            your order live, from the kitchen to your door.
          </p>
          <Link to="/menu">Start an order</Link>
        </div>
        <div>
          <h2>Tables and celebrations</h2>
          <p>Tables are confirmed right away. Birthday parties and corporate events are approved by our team.</p>
          <Link to="/reservations">Make a booking</Link>
        </div>
        <div>
          <h2>Ask the assistant</h2>
          <p>Ask about today&apos;s special, vegetarian or gluten-free dishes, or what you ordered last time.</p>
          <span className="muted small">Open the chat button at the bottom right.</span>
        </div>
      </section>
    </>
  )
}
