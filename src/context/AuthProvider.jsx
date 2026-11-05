import { useCallback, useMemo, useState } from 'react'
import { AuthContext } from './AuthContext.js'
import * as authService from '../services/authService.js'
import { getGuestId, readJSON, removeKey, writeJSON } from '../services/storage.js'

// sessionStorage is per tab, so one tab can be the admin and another a customer.
const SESSION_KEY = 'basil-brick:session'

function rememberSession(userId) {
  try {
    writeJSON(SESSION_KEY, userId, 'session')
  } catch {
    // Storage disabled: the user stays signed in until refresh.
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
