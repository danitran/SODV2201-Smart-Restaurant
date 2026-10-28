/**
 * AuthContext.js — context object + hook for the signed-in user.
 * The provider is in AuthProvider.jsx.
 *
 *   const { user, isAdmin, login, logout } = useAuth()
 */
import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth() must be used inside <AuthProvider>.')
  return context
}
