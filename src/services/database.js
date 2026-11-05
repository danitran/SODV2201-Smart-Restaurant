import { createSeedDatabase } from '../data/seed.js'
import { readJSON, writeJSON } from './storage.js'

export const DB_KEY = 'basil-brick:db:v2'
const DB_VERSION = 2

const isValidDatabase = (db) =>
  db && db.version === DB_VERSION && Array.isArray(db.menu) && Array.isArray(db.orders) && Array.isArray(db.users)

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

export function updateDatabase(change) {
  const db = loadDatabase()
  const result = change(db)
  saveDatabase(db)
  return result
}

export function resetDatabase() {
  const fresh = createSeedDatabase()
  saveDatabase(fresh)
  return fresh
}

// The storage event fires in every other open tab when one tab saves, keeping them in sync.
export function subscribeToDatabase(onChange) {
  const handleStorage = (event) => {
    if (event.key === DB_KEY) onChange(loadDatabase())
  }
  window.addEventListener('storage', handleStorage)
  return () => window.removeEventListener('storage', handleStorage)
}
