/**
 * menuFilters.js — search, filter and sort logic for the menu page.
 *
 * The filters live in the URL query string (?category=mains&diet=vegetarian
 * &q=pasta&max=20&sort=price-asc). readFilters() turns the URL into an
 * object, toSearchParams() turns the object back into the URL, and
 * filterMenu() returns the dishes to show. Keeping filters in the URL means
 * the back button works and a filtered menu can be shared as a link.
 */
import { CATEGORIES, DIETARY_TAGS } from '../data/restaurantInfo.js'

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name: A to Z' },
]

export const DEFAULT_FILTERS = { category: 'all', query: '', diets: [], maxPrice: null, sort: 'featured' }

const VALID_CATEGORIES = new Set(['all', ...CATEGORIES.map((category) => category.id)])
const VALID_DIETS = new Set(DIETARY_TAGS.map((tag) => tag.id))
const VALID_SORTS = new Set(SORT_OPTIONS.map((option) => option.value))

/** URLSearchParams → filters object (ignores anything invalid in the URL). */
export function readFilters(searchParams) {
  const category = searchParams.get('category') ?? 'all'
  const sort = searchParams.get('sort') ?? 'featured'
  const max = Number(searchParams.get('max'))
  return {
    category: VALID_CATEGORIES.has(category) ? category : 'all',
    query: searchParams.get('q') ?? '',
    diets: (searchParams.get('diet') ?? '').split(',').filter((diet) => VALID_DIETS.has(diet)),
    maxPrice: Number.isFinite(max) && max > 0 ? max : null,
    sort: VALID_SORTS.has(sort) ? sort : 'featured',
  }
}

/** Filters object → plain object for setSearchParams (default values are left out). */
export function toSearchParams(filters) {
  const params = {}
  if (filters.category !== 'all') params.category = filters.category
  if (filters.query.trim()) params.q = filters.query
  if (filters.diets.length) params.diet = filters.diets.join(',')
  if (filters.maxPrice) params.max = String(filters.maxPrice)
  if (filters.sort !== 'featured') params.sort = filters.sort
  return params
}

/** True if a dish matches the search text (name, description, ingredients or category). */
export function matchesQuery(item, query) {
  const text = query.trim().toLowerCase()
  if (!text) return true
  const category = CATEGORIES.find((entry) => entry.id === item.category)?.label ?? ''
  const haystack = [item.name, item.description, category, ...item.ingredients].join(' ').toLowerCase()
  return text.split(/\s+/).every((word) => haystack.includes(word))
}

const categoryOrder = (item) => CATEGORIES.findIndex((category) => category.id === item.category)

/** Returns the dishes that pass every filter, in the chosen order. */
export function filterMenu(menu, filters) {
  const results = menu.filter(
    (item) =>
      (filters.category === 'all' || item.category === filters.category) &&
      filters.diets.every((diet) => item.dietary.includes(diet)) &&
      (!filters.maxPrice || item.price <= filters.maxPrice) &&
      matchesQuery(item, filters.query),
  )

  const sorters = {
    featured: (a, b) => Number(b.isSpecial) - Number(a.isSpecial) || categoryOrder(a) - categoryOrder(b),
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name),
  }
  return [...results].sort(sorters[filters.sort] ?? sorters.featured)
}

/** Highest menu price rounded up to the next $5 (for the price slider). */
export function getPriceCeiling(menu) {
  const highest = Math.max(10, ...menu.map((item) => item.price))
  return Math.ceil(highest / 5) * 5
}

/** Groups dishes by category, keeping the menu's category order. */
export function groupByCategory(items) {
  return CATEGORIES.map((category) => ({
    ...category,
    items: items.filter((item) => item.category === category.id),
  })).filter((group) => group.items.length > 0)
}
