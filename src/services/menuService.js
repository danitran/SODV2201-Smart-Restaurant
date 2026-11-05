import { ApiError } from './apiError.js'
import { updateDatabase } from './database.js'
import { simulateNetwork } from './network.js'
import { roundMoney } from '../utils/format.js'
import { uniqueSlug } from '../utils/ids.js'
import { hasErrors, validateMenuItem } from '../utils/validation.js'

function normalizeMenuItem(input) {
  const ingredients = Array.isArray(input.ingredients)
    ? input.ingredients
    : String(input.ingredients ?? '').split(',')
  return {
    name: input.name.trim(),
    category: input.category,
    description: input.description.trim(),
    ingredients: ingredients.map((part) => part.trim()).filter(Boolean),
    price: roundMoney(input.price),
    dietary: [...(input.dietary ?? [])],
    emoji: input.emoji?.trim() || '🍽️',
    available: input.available !== false,
    spicy: Boolean(input.spicy),
  }
}

function findItem(db, id) {
  const item = db.menu.find((menuItem) => menuItem.id === id)
  if (!item) throw new ApiError('This menu item no longer exists. It may have been deleted in another tab.')
  return item
}

export async function createMenuItem(input) {
  await simulateNetwork()
  return updateDatabase((db) => {
    const errors = validateMenuItem(input, db.menu)
    if (hasErrors(errors)) throw new ApiError('Please fix the highlighted fields.', errors)
    const item = { id: uniqueSlug(input.name, db.menu), ...normalizeMenuItem(input), isSpecial: false }
    db.menu.push(item)
    return item
  })
}

export async function updateMenuItem(id, input) {
  await simulateNetwork()
  return updateDatabase((db) => {
    const item = findItem(db, id)
    const errors = validateMenuItem({ ...input, id }, db.menu)
    if (hasErrors(errors)) throw new ApiError('Please fix the highlighted fields.', errors)
    Object.assign(item, normalizeMenuItem(input))
    return item
  })
}

export async function deleteMenuItem(id) {
  await simulateNetwork()
  return updateDatabase((db) => {
    const item = findItem(db, id)
    db.menu = db.menu.filter((menuItem) => menuItem.id !== id)
    return item
  })
}

export async function setItemAvailability(id, available) {
  await simulateNetwork(120)
  return updateDatabase((db) => {
    const item = findItem(db, id)
    item.available = available
    return item
  })
}

export async function setTodaysSpecial(id) {
  await simulateNetwork(120)
  return updateDatabase((db) => {
    const special = findItem(db, id)
    db.menu.forEach((item) => {
      item.isSpecial = item.id === id
    })
    return special
  })
}
