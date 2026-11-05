export function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

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

// Demo only: the Node.js back end will hash passwords with bcrypt.
export function hashPassword(password) {
  const text = `basil-brick:${password}`
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}
