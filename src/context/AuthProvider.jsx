/**
 * AuthProvider.jsx — who is using the app right now.
 *
 * - `user` is null for guests, or the signed-in customer/admin.
 * - The user id is kept in sessionStorage (per tab), so you can be a
 *   customer in one tab and the admin in another during the demo.
 * - `ownerId` links orders, bookings and notifications to the person:
 *   the user's id when signed in, otherwise this browser's guest id.
 */
import { useCallback, useMemo, useState } from 'react'
import { AuthContext } from './AuthContext.js'
import * as authService from '../services/authService.js'
import { getGuestId, readJSON, removeKey, writeJSON } from '../services/storage.js'

const SESSION_KEY = 'basil-brick:session'

function rememberSession(userId) {
  try {
    writeJSON(SESSION_KEY, userId, 'session')
  } catch {
    // If the tab cannot store the session, the user stays signed in until refresh.
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedId = readJSON(SESSION_KEY, null, 'session')
    return savedId ? authService.getUserById(savedId) : null
  })
  const [guestId] = useState(getGuestId)

  const login = useCallback(async (email, password) => {
    const signedIn = await authService.login(email, password)
    rememberSession(signedIn.id)
    setUser(signedIn)
    return signedIn
  }, [])

  const register = useCallback(async (form) => {
    const created = await authService.register(form)
    rememberSession(created.id)
    setUser(created)
    return created
  }, [])

  const logout = useCallback(() => {
    removeKey(SESSION_KEY, 'session')
    setUser(null)
  }, [])

  const saveProfile = useCallback(
    async (changes) => {
      const updated = await authService.updateProfile(user.id, changes)
      setUser(updated)
      return updated
    },
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      isAdmin: user?.role === 'admin',
      ownerId: user?.id ?? guestId,
      login,
      register,
      logout,
      saveProfile,
    }),
    [user, guestId, login, register, logout, saveProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
