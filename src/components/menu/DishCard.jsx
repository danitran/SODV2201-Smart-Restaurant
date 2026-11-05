import { Link } from 'react-router'
import { useTilt } from '../../hooks/useTilt.js'
import { formatPrice } from '../../utils/format.js'
import { DishBadges } from '../common/Badges.jsx'
import { DishImage } from '../common/DishImage.jsx'

export function DishCard({ item, inCart = 0, onAdd, meta, compact = false }) {
  const tiltRef = useTilt()
  const flag = !item.available ? 'Sold out today' : item.isSpecial ? "Today's special" : null

  return (
    <article
      ref={tiltRef}
      className={`dish-card tilt${item.available ? '' : ' is-soldout'}`}
      aria-labelledby={`dish-${item.id}`}
    >
      <Link to={`/menu/${item.id}`} className="dish-card__media glare" tabIndex={-1} aria-hidden="true" data-cursor="view">
        <DishImage item={item} sizes="(max-width: 640px) 92vw, 360px" />
      </Link>
      <span className="dish-card__price" aria-hidden="true">
        {formatPrice(item.price)}
      </span>
      {flag && <span className={`badge dish-card__flag ${item.available ? 'badge--special' : 'badge--soldout'}`}>{flag}</span>}
      <div className="dish-card__body">
        <h3 className="dish-card__name" id={`dish-${item.id}`}>
          <Link to={`/menu/${item.id}`}>{item.name}</Link>
          <span className="sr-only">, {formatPrice(item.price)}</span>
        </h3>
        {meta && <p className="dish-card__meta">{meta}</p>}
        {!compact && (
          <>
            <p className="dish-card__desc">{item.description}</p>
            <p className="dish-card__ingredients">
              <span className="sr-only">Ingredients: </span>
              {item.ingredients.join(', ')}
            </p>
            <DishBadges item={item} showSpecial={false} showSoldOut={false} />
          </>
        )}
        <div className="dish-card__foot">
          <button
            type="button"
            className="button button--small"
            onClick={() => onAdd(item)}
            disabled={!item.available}
            aria-label={item.available ? `Add ${item.name} to your order` : `${item.name} is sold out`}
          >
            {item.available ? 'Add to order' : 'Sold out'}
          </button>
          {inCart > 0 && <span className="dish-card__incart">{inCart} in order</span>}
        </div>
      </div>
    </article>
  )
}
