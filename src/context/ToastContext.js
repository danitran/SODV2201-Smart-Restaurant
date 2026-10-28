/**
 * ToastContext.js — context object + hook for pop-up messages ("toasts").
 *
 * Usage in any component:
 *   const { showToast } = useToast()
 *   showToast('Added to your order', { type: 'success' })
 *
 * The provider component lives in ToastProvider.jsx. Keeping the hook in a
 * separate .js file lets Vite's Fast Refresh work on the provider file.
 */
import { createContext, useContext } from 'react'

export const ToastContext = createContext(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast() must be used inside <ToastProvider>.')
  return context
}
