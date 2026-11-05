import { Link } from 'react-router'
import { formatPrice } from '../../utils/format.js'
import { DishBadges } from '../common/Badges.jsx'

export function MenuItemRow({ item, inCart = 0, onAdd }) {
  return (
    <article className={`menu-row ${item.available ? '' : 'is-soldout'}`} aria-labelledby={`dish-${item.id}`}>
      <span className="dish-tile" aria-hidden="true">
        {item.emoji}
      </span>

      <div className="menu-row__body">
        <h3 className="menu-row__title" id={`dish-${item.id}`}>
          <Link to={`/menu/${item.id}`}>{item.name}</Link>
          <span className="menu-row__leader" aria-hidden="true" />
          <span className="menu-row__price">{formatPrice(item.price)}</span>
        </h3>
        <p className="menu-row__desc">{item.description}</p>
        <p className="menu-row__ingredients">
          <span className="sr-only">Ingredients: </span>
          {item.ingredients.join(', ')}
        </p>
        <DishBadges item={item} />
      </div>

      <div className="menu-row__action">
        <button
          type="button"
          className="button button--small"
          onClick={() => onAdd(item)}
          disabled={!item.available}
          aria-label={item.available ? `Add ${item.name} to your order` : `${item.name} is sold out`}
        >
          {item.available ? 'Add' : 'Sold out'}
        </button>
        {inCart > 0 && <span className="menu-row__incart">{inCart} in order</span>}
      </div>
    </article>
  )
}
