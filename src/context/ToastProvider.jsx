/**
 * ToastProvider.jsx — shows short messages in the corner of the screen.
 *
 * State: `toasts`, an array of { id, title, message, type }.
 * showToast() adds one and removes it again after a few seconds.
 * The stack is an aria-live region, so screen readers announce new toasts.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ToastContext } from './ToastContext.js'

const DURATION_MS = 4500

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
  }, [])

  const showToast = useCallback(
    (message, { type = 'success', title = '' } = {}) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      // Replace an identical message instead of stacking it, and keep at most 3 on screen.
      setToasts((current) => [
        ...current.filter((toast) => toast.message !== message).slice(-2),
        { id, title, message, type },
      ])
      timers.current.set(id, setTimeout(() => dismissToast(id), DURATION_MS))
    },
    [dismissToast],
  )

  // Clear any pending timers if the provider unmounts.
  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => clearTimeout(timer))
  }, [])

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
            <div className="toast__body">
              {toast.title && <strong className="toast__title">{toast.title}</strong>}
              <span>{toast.message}</span>
            </div>
            <button type="button" className="toast__close" onClick={() => dismissToast(toast.id)} aria-label="Dismiss message">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
