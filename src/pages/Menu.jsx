/**
 * Menu.jsx — browse, search and filter the menu, and add dishes to the order.
 *
 * - The filters live in component state (`filters`), so inputs update
 *   instantly, and are mirrored into the URL with useSearchParams() so a
 *   filtered menu can be shared as a link.
 * - React Router updates the URL in a low-priority transition. If the inputs
 *   read their values straight from the URL, fast typing could lose letters,
 *   which is why the state is the source of truth while you type.
 * - This page writes the URL with replace: true. Any other kind of navigation
 *   (a link such as the assistant's "See all gluten-free dishes" or the Menu
 *   link in the header, or the back button) comes from outside, so its
 *   filters are loaded into state. This uses React's "adjust state when a
 *   value changes" pattern: compare with the last seen location.key during
 *   render, instead of an effect that would render twice.
 * - filterMenu() (utils/menuFilters.js) does the actual filtering.
 * - With "All" selected and the default sort, dishes are grouped under
 *   Starters / Mains / Desserts / Beverages like a printed menu.
 * - Sold-out dishes stay visible but cannot be added (admins toggle this).
 */
import { useState } from 'react'
import { useLocation, useNavigationType, useSearchParams } from 'react-router'
import { useAuth } from '../context/AuthContext.js'
import { useCart } from '../context/CartContext.js'
import { useRestaurant } from '../context/RestaurantContext.js'
import { useToast } from '../context/ToastContext.js'
import { CATEGORIES } from '../data/restaurantInfo.js'
import {
  DEFAULT_FILTERS,
  filterMenu,
  getPriceCeiling,
  groupByCategory,
  readFilters,
  toSearchParams,
} from '../utils/menuFilters.js'
import { pluralize } from '../utils/format.js'
import { EmptyState } from '../components/common/Feedback.jsx'
import { MenuFilters } from '../components/menu/MenuFilters.jsx'
import { MenuItemRow } from '../components/menu/MenuItemRow.jsx'

export default function Menu() {
  const { menu } = useRestaurant()
  const { user } = useAuth()
  const { addItem, getQuantity } = useCart()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState(() => readFilters(searchParams))
  // Phones only: the filter panel is hidden until the Filters button is pressed.
  const [showFilters, setShowFilters] = useState(false)

  // Adopt filters from navigations that did not come from this page (see above).
  const location = useLocation()
  const navigationType = useNavigationType()
  const [seenLocationKey, setSeenLocationKey] = useState(location.key)
  if (location.key !== seenLocationKey) {
    setSeenLocationKey(location.key)
    if (navigationType !== 'REPLACE') setFilters(readFilters(searchParams))
  }

  const results = filterMenu(menu, filters)
  const grouped = filters.category === 'all' && filters.sort === 'featured'
  const activeFilterCount =
    filters.diets.length + (filters.query.trim() ? 1 : 0) + (filters.maxPrice ? 1 : 0) + (filters.sort !== 'featured' ? 1 : 0)

  const updateFilters = (changes) => {
    const next = { ...filters, ...changes }
    setFilters(next)
    // replace: true → typing does not add a history entry per letter, and it
    // tells the effect above that this URL change came from this page.
    setSearchParams(toSearchParams(next), { replace: true })
  }
  const resetFilters = () => updateFilters(DEFAULT_FILTERS)

  const handleAdd = (item) => {
    addItem(item.id)
    showToast(`${item.name} was added to your order.`)
  }

  const renderRows = (items) =>
    items.map((item) => (
      <MenuItemRow key={item.id} item={item} inCart={getQuantity(item.id)} onAdd={handleAdd} />
    ))

  return (
    <div className="container page">
      <header className="page-header">
        <div>
          <h1>Menu</h1>
          <p>Wood-fired pizzas, fresh pasta, salads and desserts. Filter by diet or price, then add dishes to your order.</p>
        </div>
      </header>

      <div className="category-tabs" role="group" aria-label="Category">
        {[{ id: 'all', label: 'All dishes' }, ...CATEGORIES].map((category) => (
          <button
            key={category.id}
            type="button"
            className="category-tab"
            aria-pressed={filters.category === category.id}
            onClick={() => updateFilters({ category: category.id })}
          >
            {category.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="button button--secondary button--small filters-toggle"
        aria-expanded={showFilters}
        aria-controls="menu-filters"
        onClick={() => setShowFilters((open) => !open)}
      >
        {showFilters ? 'Hide filters' : `Filters${activeFilterCount ? ` (${activeFilterCount})` : ''}`}
      </button>

      <div className="menu-layout">
        <MenuFilters
          isOpen={showFilters}
          filters={filters}
          onChange={updateFilters}
          priceCeiling={getPriceCeiling(menu)}
          savedDiets={user?.preferences?.dietary ?? []}
          onReset={resetFilters}
        />

        <section className="menu-results" aria-label="Dishes">
          <p className="menu-results__count" aria-live="polite">
            Showing {results.length} of {pluralize(menu.length, 'dish', 'dishes')}
          </p>

          {results.length === 0 && (
            <EmptyState
              icon="🔍"
              title="No dishes match these filters"
              actions={
                <button type="button" className="button" onClick={resetFilters}>
                  Clear filters
                </button>
              }
            >
              Try fewer dietary options, a higher price, or a different search word.
            </EmptyState>
          )}

          {grouped
            ? groupByCategory(results).map((group) => (
                <section key={group.id} className="menu-group" aria-labelledby={`group-${group.id}`}>
                  <h2 id={`group-${group.id}`} className="menu-group__title">
                    {group.label}
                  </h2>
                  {renderRows(group.items)}
                </section>
              ))
            : results.length > 0 && <div className="menu-group">{renderRows(results)}</div>}
        </section>
      </div>
    </div>
  )
}
