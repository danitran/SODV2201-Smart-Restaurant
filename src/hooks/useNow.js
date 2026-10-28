/**
 * useNow.js — a custom hook that returns the current date and time and
 * refreshes it every minute (by default).
 *
 * Calling new Date() directly while rendering gives a different value on
 * every render, which React's lint rules flag as "impure". Keeping "now" in
 * state makes renders predictable, and the interval keeps it up to date so,
 * for example, booking times that pass while the page is open get disabled.
 */
import { useEffect, useState } from 'react'

export function useNow(refreshMs = 60_000) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), refreshMs)
    return () => clearInterval(timer) // stop the timer when the component unmounts
  }, [refreshMs])

  return now
}
