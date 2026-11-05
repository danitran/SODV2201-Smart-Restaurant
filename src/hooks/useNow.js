import { useEffect, useState } from 'react'

export function useNow(refreshMs = 60_000) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), refreshMs)
    return () => clearInterval(timer)
  }, [refreshMs])

  return now
}
