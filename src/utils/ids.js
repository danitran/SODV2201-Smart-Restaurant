/**
 * ids.js — ids, slugs and the demo password hash.
 */

/** Random id such as "ntf-lq3k9x2a" for notifications, feedback, etc. */
export function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/** "Chicken Alfredo!" → "chicken-alfredo" */
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** A slug that is not used yet: "chicken-alfredo", then "chicken-alfredo-2", … */
export function uniqueSlug(text, existingItems) {
  const base = slugify(text) || 'item'
  let candidate = base
  let n = 2
  while (existingItems.some((item) => item.id === candidate)) {
    candidate = `${base}-${n}`
    n += 1
  }
  return candidate
}

/**
 * Demo-only password hash (FNV-1a, 32-bit) so plain passwords are never
 * stored in the browser. It is NOT secure enough for production: when the
 * Node.js back end is added, passwords will be hashed on the server with
 * bcrypt instead.
 */
export function hashPassword(password) {
  const text = `basil-brick:${password}`
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}
