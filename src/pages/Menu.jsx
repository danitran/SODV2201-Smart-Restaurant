/**
 * Menu.jsx — browse, search and filter the menu, and add dishes to the order.
 *
 * - The filter values are stored in the URL with useSearchParams(), so the
 *   browser's back button and shared links keep the same filters.
 * - filterMenu() (utils/menuFilters.js) does the actual filtering.
 * - With "All" selected and the default sort, dishes are grouped under
 *   Starters / Mains / Desserts / Beverages like a printed menu.
 * - Sold-out dishes stay visible but cannot be added (admins toggle this).
 */
import { useState } from 'react'
import { useSearchParams } from 'react-router'
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
  // Phones only: the filter panel is hidden until the Filters button is pressed.
  const [showFilters, setShowFilters] = useState(false)

  const filters = readFilters(searchParams)
  const results = filterMenu(menu, filters)
  const grouped = filters.category === 'all' && filters.sort === 'featured'
  const activeFilterCount =
    filters.diets.length + (filters.query.trim() ? 1 : 0) + (filters.maxPrice ? 1 : 0) + (filters.sort !== 'featured' ? 1 : 0)

  // replace: true → typing in the search box does not add a history entry per letter.
  const updateFilters = (changes) => setSearchParams(toSearchParams({ ...filters, ...changes }), { replace: true })
  const resetFilters = () => setSearchParams(toSearchParams(DEFAULT_FILTERS))

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
