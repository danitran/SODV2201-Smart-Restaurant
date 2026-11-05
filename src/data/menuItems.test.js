import { describe, expect, it } from 'vitest'
import { CATEGORIES } from './restaurantInfo.js'
import { MENU_ITEMS } from './menuItems.js'

describe('menu data', () => {
  it('has 22 dishes with unique ids in known categories', () => {
    expect(MENU_ITEMS).toHaveLength(22)
    expect(new Set(MENU_ITEMS.map((item) => item.id)).size).toBe(22)
    for (const item of MENU_ITEMS) expect(CATEGORIES.map((category) => category.id)).toContain(item.category)
  })

  it('gives every dish its own photo', () => {
    const photos = MENU_ITEMS.map((item) => item.image)
    for (const url of photos) expect(url).toMatch(/^https:\/\/images\.unsplash\.com\/photo-[\w-]+\?auto=format&fit=crop&w=800&q=75$/)
    expect(new Set(photos).size).toBe(photos.length)
  })
})
