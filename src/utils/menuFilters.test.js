import { describe, expect, it } from 'vitest'
import { MENU_ITEMS } from '../data/menuItems.js'
import { filterMenu, readFilters, toSearchParams, DEFAULT_FILTERS } from './menuFilters.js'

const menu = MENU_ITEMS.map((item) => ({ ...item, available: true, isSpecial: Boolean(item.isSpecial) }))
const names = (items) => items.map((item) => item.name)

describe('filterMenu', () => {
  it('shows all 22 dishes with no filters, special first', () => {
    const result = filterMenu(menu, DEFAULT_FILTERS)
    expect(result).toHaveLength(22)
    expect(result[0].name).toBe('Chicken Alfredo')
  })

  it('filters by category', () => {
    expect(filterMenu(menu, { ...DEFAULT_FILTERS, category: 'desserts' })).toHaveLength(4)
  })

  it('dietary filters must ALL match', () => {
    const result = filterMenu(menu, { ...DEFAULT_FILTERS, category: 'mains', diets: ['gluten-free', 'dairy-free'] })
    expect(names(result).sort()).toEqual(['Gluten-Free Penne Bolognese', 'Grilled Salmon'])
  })

  it('search looks at ingredients too', () => {
    expect(names(filterMenu(menu, { ...DEFAULT_FILTERS, query: 'mascarpone' }))).toEqual(['Classic Tiramisu'])
  })

  it('max price and sorting by price', () => {
    const result = filterMenu(menu, { ...DEFAULT_FILTERS, category: 'mains', maxPrice: 17, sort: 'price-asc' })
    expect(names(result)).toEqual(['Margherita Pizza', 'Vegetable Pasta'])
  })
})

describe('URL filters', () => {
  it('reads valid values and ignores invalid ones', () => {
    const filters = readFilters(new URLSearchParams('category=pizza&diet=vegan,keto&max=abc&sort=price-desc'))
    expect(filters).toEqual({ category: 'all', query: '', diets: ['vegan'], maxPrice: null, sort: 'price-desc' })
  })

  it('round-trips through the URL, leaving defaults out', () => {
    const filters = { ...DEFAULT_FILTERS, category: 'mains', diets: ['vegetarian'] }
    expect(toSearchParams(filters)).toEqual({ category: 'mains', diet: 'vegetarian' })
    expect(readFilters(new URLSearchParams(toSearchParams(filters)))).toEqual(filters)
  })
})
