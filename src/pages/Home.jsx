import { Link } from 'react-router'
import { useCart } from '../context/CartContext.js'
import { useRestaurant } from '../context/RestaurantContext.js'
import { useToast } from '../context/ToastContext.js'
import { PRICING, RESTAURANT } from '../data/restaurantInfo.js'
import { getPopularItems } from '../utils/analytics.js'
import { formatPrice } from '../utils/format.js'
import { DishImage } from '../components/common/DishImage.jsx'
import { Icon } from '../components/common/Icon.jsx'

function SpecialsBoard({ dish, isSpecial, onAdd }) {
  if (!dish) return null
  return (
    <aside className="specials-board" aria-labelledby="special-title">
      <p className="specials-board__label">{isSpecial ? "Today's special" : "Chef's pick"}</p>
      <DishImage item={dish} alt={dish.name} className="specials-board__photo" loading="eager" sizes="(max-width: 900px) 100vw, 480px" />
      <h2 id="special-title" className="specials-board__name">
        {dish.name}
      </h2>
      <p className="specials-board__text">{dish.description}</p>
      <div className="specials-board__footer">
        <span className="specials-board__price">{formatPrice(dish.price)}</span>
        <button type="button" className="button button--basil" onClick={() => onAdd(dish)} disabled={!dish.available}>
          {dish.available ? 'Add to order' : 'Sold out today'}
        </button>
      </div>
      <Link className="specials-board__link" to={`/menu/${dish.id}`}>
        Ingredients and details
      </Link>
    </aside>
  )
}

export default function Home() {
  const { menu, orders } = useRestaurant()
  const { addItem } = useCart()
  const { showToast } = useToast()

  const popular = getPopularItems(orders, menu, { limit: 4 })
  const special = menu.find((item) => item.isSpecial)
  const boardDish = special ?? popular[0]

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
          <SpecialsBoard dish={boardDish} isSpecial={Boolean(special)} onAdd={handleAdd} />
        </div>
      </section>

      <section className="container home-section" aria-labelledby="popular-title">
        <div className="section-head">
          <h2 id="popular-title">Most ordered this month</h2>
          <Link to="/menu">See the full menu</Link>
        </div>
        <ol className="popular-list">
          {popular.map((dish) => (
            <li key={dish.id} className="popular-dish">
              <DishImage item={dish} className="dish-tile" sizes="56px" />
              <div className="popular-dish__info">
                <Link to={`/menu/${dish.id}`} className="popular-dish__name">
                  {dish.name}
                </Link>
                <span className="muted small">Ordered {dish.quantity} times</span>
              </div>
              <span className="popular-dish__price">{formatPrice(dish.price)}</span>
              <button
                type="button"
                className="button button--small"
                onClick={() => handleAdd(dish)}
                disabled={!dish.available}
                aria-label={`Add ${dish.name} to your order`}
              >
                {dish.available ? 'Add' : 'Sold out'}
              </button>
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
