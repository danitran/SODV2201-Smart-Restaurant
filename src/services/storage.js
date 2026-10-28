/**
 * storage.js — safe wrappers around the browser's Web Storage.
 *
 * localStorage   keeps data after the browser is closed (our "database",
 *                the cart, the guest id).
 * sessionStorage is per tab and clears when the tab closes (the signed-in
 *                user), so one tab can be a customer while another tab is
 *                the admin during the demo.
 *
 * Storage can fail (private mode, storage full, broken JSON), so every call
 * is wrapped in try/catch and the app keeps working with a fallback value.
 */
import { ApiError } from './apiError.js'

function getStore(kind) {
  try {
    return kind === 'session' ? globalThis.sessionStorage : globalThis.localStorage
  } catch {
    return undefined // access can throw when storage is disabled
  }
}

/** Reads and parses JSON. Returns `fallback` if the key is missing or broken. */
export function readJSON(key, fallback = null, kind = 'local') {
  try {
    const raw = getStore(kind)?.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (error) {
    console.warn(`Could not read "${key}" from storage. Using default data.`, error)
    return fallback
  }
}

/** Saves a value as JSON. Throws an ApiError the UI can show if saving fails. */
export function writeJSON(key, value, kind = 'local') {
  const store = getStore(kind)
  if (!store) throw new ApiError('Your browser is blocking storage, so changes cannot be saved.')
  try {
    store.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Could not save "${key}".`, error)
    throw new ApiError('Saving failed because browser storage is full or disabled.')
  }
}

export function removeKey(key, kind = 'local') {
  try {
    getStore(kind)?.removeItem(key)
  } catch {
    // nothing to do: the key is gone either way
  }
}

/**
 * A random id for this browser, used to link guest orders, reservations
 * and notifications to the person who made them without an account.
 */
export function getGuestId() {
  const key = 'basil-brick:guest-id'
  let id = readJSON(key)
  if (!id) {
    id = `guest-${Math.random().toString(36).slice(2, 10)}`
    try {
      writeJSON(key, id)
    } catch {
      // storage blocked: the id only lasts for this page load
    }
  }
  return id
}
