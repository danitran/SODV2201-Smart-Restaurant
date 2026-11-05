import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useCart } from '../context/CartContext.js'
import { useRestaurant } from '../context/RestaurantContext.js'
import { useToast } from '../context/ToastContext.js'
import { CATEGORIES, DIETARY_TAGS } from '../data/restaurantInfo.js'
import { formatPrice } from '../utils/format.js'
import { DishBadges } from '../components/common/Badges.jsx'
import { DishImage } from '../components/common/DishImage.jsx'
import { EmptyState } from '../components/common/Feedback.jsx'
import { Icon } from '../components/common/Icon.jsx'
import { QuantityStepper } from '../components/common/QuantityStepper.jsx'

export default function MenuItemDetail() {
  const { itemId } = useParams()
  const { menu } = useRestaurant()
  const { addItem, getQuantity } = useCart()
  const { showToast } = useToast()
  const [quantity, setQuantity] = useState(1)

  const item = menu.find((menuItem) => menuItem.id === itemId)

  if (!item) {
    return (
      <div className="container page">
        <EmptyState
          icon="utensils"
          title="This dish is not on the menu"
          actions={
            <Link className="button" to="/menu">
              Back to the menu
            </Link>
          }
        >
          It may have been removed by the restaurant, or the link is wrong.
        </EmptyState>
      </div>
    )
  }

  const category = CATEGORIES.find((entry) => entry.id === item.category)
  const dietLabels = DIETARY_TAGS.filter((tag) => item.dietary.includes(tag.id)).map((tag) => tag.label)
  const related = menu.filter((other) => other.category === item.category && other.id !== item.id).slice(0, 3)

  const handleAdd = () => {
    addItem(item.id, quantity)
    showToast(`${quantity} × ${item.name} added to your order.`)
    setQuantity(1)
  }

  return (
    <div className="container page">
      <Link to="/menu" className="back-link">
        <Icon name="chevronLeft" size={16} /> Back to the menu
      </Link>

      <article className="dish-detail">
        <div className="dish-detail__art gilt-frame">
          <DishImage item={item} alt={item.name} loading="eager" sizes="(max-width: 800px) 100vw, 520px" />
        </div>

        <div className="dish-detail__info">
          <p className="dish-detail__category">{category?.label}</p>
          <h1>{item.name}</h1>
          <p className="dish-detail__price">{formatPrice(item.price)}</p>
          <DishBadges item={item} />
          <p className="dish-detail__desc">{item.description}</p>

          <h2>Ingredients</h2>
          <ul className="ingredient-list">
            {item.ingredients.map((ingredient) => (
              <li key={ingredient}>{ingredient}</li>
            ))}
          </ul>
          <p className="small muted">
            {dietLabels.length
              ? `Suitable for: ${dietLabels.join(', ')}.`
              : 'Contains meat, fish, gluten or dairy. Ask us about allergies before ordering.'}
          </p>

          {item.available ? (
            <div className="dish-detail__buy">
              <QuantityStepper value={quantity} onChange={setQuantity} label={item.name} />
              <button type="button" className="button button--large" onClick={handleAdd}>
                Add {quantity} to order, {formatPrice(item.price * quantity)}
              </button>
            </div>
          ) : (
            <p className="form-banner">Sold out for today. Check back tomorrow or try something similar below.</p>
          )}
          {getQuantity(item.id) > 0 && (
            <p className="small">
              You have {getQuantity(item.id)} in your order. <Link to="/cart">Review your order</Link>
            </p>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="home-section" aria-labelledby="related-title">
          <h2 id="related-title">More {category?.label.toLowerCase()}</h2>
          <ul className="related-list">
            {related.map((other) => (
              <li key={other.id}>
                <Link to={`/menu/${other.id}`} className="related-dish">
                  <DishImage item={other} className="dish-tile" sizes="56px" />
                  <span>
                    <strong>{other.name}</strong>
                    <span className="muted small">{formatPrice(other.price)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
