import { ApiError } from './apiError.js'

function getStore(kind) {
  try {
    return kind === 'session' ? globalThis.sessionStorage : globalThis.localStorage
  } catch {
    return undefined
  }
}

export function readJSON(key, fallback = null, kind = 'local') {
  try {
    const raw = getStore(kind)?.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (error) {
    console.warn(`Could not read "${key}" from storage. Using default data.`, error)
    return fallback
  }
}

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
    // Storage disabled: nothing to remove.
  }
}

export function getGuestId() {
  const key = 'basil-brick:guest-id'
  let id = readJSON(key)
  if (!id) {
    id = `guest-${Math.random().toString(36).slice(2, 10)}`
    try {
      writeJSON(key, id)
    } catch {
      // Storage disabled: the id lasts for this page load only.
    }
  }
  return id
}
