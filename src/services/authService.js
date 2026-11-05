import { ApiError } from './apiError.js'
import { loadDatabase, updateDatabase } from './database.js'
import { simulateNetwork } from './network.js'
import { createId, hashPassword } from '../utils/ids.js'
import { hasErrors, validateProfile, validateRegistration } from '../utils/validation.js'

export function toPublicUser(user) {
  if (!user) return null
  const { passwordHash: _passwordHash, ...publicUser } = user
  return publicUser
}

export function getUserById(id) {
  return toPublicUser(loadDatabase().users.find((user) => user.id === id))
}

const sameEmail = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()

export async function login(email, password) {
  await simulateNetwork()
  const user = loadDatabase().users.find((candidate) => sameEmail(candidate.email, email ?? ''))
  if (!user || user.passwordHash !== hashPassword(password ?? '')) {
    throw new ApiError('Email or password is incorrect.')
  }
  return toPublicUser(user)
}

export async function register(form) {
  await simulateNetwork()
  return updateDatabase((db) => {
    const errors = validateRegistration(form)
    if (db.users.some((user) => sameEmail(user.email, form.email ?? ''))) {
      errors.email = 'An account with this email already exists. Sign in instead.'
    }
    if (hasErrors(errors)) throw new ApiError('Please fix the highlighted fields.', errors)

    const user = {
      id: createId('u'),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      address: '',
      role: 'customer',
      passwordHash: hashPassword(form.password),
      preferences: { dietary: [] },
      createdAt: new Date().toISOString(),
    }
    db.users.push(user)
    return toPublicUser(user)
  })
}

export async function updateProfile(userId, changes) {
  await simulateNetwork()
  return updateDatabase((db) => {
    const user = db.users.find((candidate) => candidate.id === userId)
    if (!user) throw new ApiError('Your account was not found. Please sign in again.')
    const errors = validateProfile(changes)
    if (hasErrors(errors)) throw new ApiError('Please fix the highlighted fields.', errors)

    user.name = changes.name.trim()
    user.phone = (changes.phone ?? '').trim()
    user.address = (changes.address ?? '').trim()
    user.preferences = { dietary: [...(changes.preferences?.dietary ?? [])] }
    return toPublicUser(user)
  })
}
