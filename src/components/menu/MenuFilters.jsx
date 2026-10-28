/**
 * MenuFilters.jsx — search box, dietary checkboxes, price slider and sort.
 *
 * Props (data down, events up):
 *   filters        current filter values (from the URL)
 *   onChange(obj)  called with only the values that changed
 *   priceCeiling   highest value of the price slider
 *   savedDiets     the signed-in customer's dietary preferences (optional)
 *   onReset()      clears every filter
 *   isOpen         on phones the panel only shows when this is true
 */
import { DIETARY_TAGS } from '../../data/restaurantInfo.js'
import { SORT_OPTIONS } from '../../utils/menuFilters.js'
import { formatPrice } from '../../utils/format.js'
import { Icon } from '../common/Icon.jsx'

export function MenuFilters({ filters, onChange, priceCeiling, savedDiets = [], onReset, isOpen = false }) {
  const toggleDiet = (dietId) => {
    const diets = filters.diets.includes(dietId)
      ? filters.diets.filter((diet) => diet !== dietId)
      : [...filters.diets, dietId]
    onChange({ diets })
  }

  const maxValue = filters.maxPrice ?? priceCeiling
  const preferencesApplied = savedDiets.length > 0 && savedDiets.every((diet) => filters.diets.includes(diet))

  return (
    <aside id="menu-filters" className={`menu-filters ${isOpen ? 'is-open' : ''}`} aria-label="Filter the menu">
      <div className="field">
        <label htmlFor="menu-search">Search dishes</label>
        <div className="search-input">
          <Icon name="search" size={18} />
          <input
            id="menu-search"
            type="search"
            placeholder="Pasta, basil, salmon…"
            value={filters.query}
            onChange={(event) => onChange({ query: event.target.value })}
          />
        </div>
      </div>

      <fieldset className="field">
        <legend>Dietary needs</legend>
        <p className="field__hint">Dishes must match every box you tick.</p>
        <div className="choice-row">
          {DIETARY_TAGS.map((tag) => (
            <label key={tag.id} className="choice">
              <input type="checkbox" checked={filters.diets.includes(tag.id)} onChange={() => toggleDiet(tag.id)} />
              {tag.label}
            </label>
          ))}
        </div>
        {savedDiets.length > 0 && !preferencesApplied && (
          <button type="button" className="link-button small" onClick={() => onChange({ diets: savedDiets })}>
            Use my saved preferences
          </button>
        )}
      </fieldset>

      <div className="field">
        <label htmlFor="menu-price">Price up to {formatPrice(maxValue)}</label>
        <input
          id="menu-price"
          type="range"
          min="5"
          max={priceCeiling}
          step="1"
          value={maxValue}
          onChange={(event) => {
            const value = Number(event.target.value)
            onChange({ maxPrice: value >= priceCeiling ? null : value })
          }}
        />
      </div>

      <div className="field">
        <label htmlFor="menu-sort">Sort by</label>
        <select id="menu-sort" value={filters.sort} onChange={(event) => onChange({ sort: event.target.value })}>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button type="button" className="button button--secondary button--small" onClick={onReset}>
        Clear filters
      </button>
    </aside>
  )
}
