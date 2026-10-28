/**
 * database.js — a tiny "database" kept in localStorage.
 *
 * The whole restaurant (menu, users, orders, reservations, feedback,
 * notifications) is one JSON object saved under DB_KEY. Services read it,
 * change it and save it back with updateDatabase().
 *
 * Real-time updates: when another tab saves the database, the browser fires
 * a "storage" event in this tab. subscribeToDatabase() listens for it, so an
 * admin changing an order status in one tab updates the customer's tracking
 * page in another tab immediately.
 */
import { createSeedDatabase } from '../data/seed.js'
import { readJSON, writeJSON } from './storage.js'

export const DB_KEY = 'basil-brick:db:v1'
const DB_VERSION = 1

const isValidDatabase = (db) =>
  db && db.version === DB_VERSION && Array.isArray(db.menu) && Array.isArray(db.orders) && Array.isArray(db.users)

/** Returns the saved database, or creates and saves the seed data the first time. */
export function loadDatabase() {
  const saved = readJSON(DB_KEY)
  if (isValidDatabase(saved)) return saved

  const fresh = createSeedDatabase()
  try {
    writeJSON(DB_KEY, fresh)
  } catch (error) {
    console.warn('Using an in-memory copy of the data because it could not be saved.', error)
  }
  return fresh
}

export function saveDatabase(db) {
  writeJSON(DB_KEY, db)
}

/**
 * Loads the database, lets `change(db)` modify it, then saves it.
 * If `change` throws (for example a validation error), nothing is saved.
 * Returns whatever `change` returns.
 */
export function updateDatabase(change) {
  const db = loadDatabase()
  const result = change(db)
  saveDatabase(db)
  return result
}

/** Replaces everything with fresh demo data. */
export function resetDatabase() {
  const fresh = createSeedDatabase()
  saveDatabase(fresh)
  return fresh
}

/**
 * Calls onChange(newDatabase) whenever another tab saves the database.
 * Returns an "unsubscribe" function for useEffect clean-up.
 */
export function subscribeToDatabase(onChange) {
  const handleStorage = (event) => {
    if (event.key === DB_KEY) onChange(loadDatabase())
  }
  window.addEventListener('storage', handleStorage)
  return () => window.removeEventListener('storage', handleStorage)
}
