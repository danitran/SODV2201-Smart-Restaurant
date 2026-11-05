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
      // The same message replaces the old one; at most 3 toasts on screen.
      setToasts((current) => [
        ...current.filter((toast) => toast.message !== message).slice(-2),
        { id, title, message, type },
      ])
      timers.current.set(id, setTimeout(() => dismissToast(id), DURATION_MS))
    },
    [dismissToast],
  )

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
