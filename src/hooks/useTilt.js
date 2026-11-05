import { useEffect, useRef } from 'react'

const canTilt = () =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function useTilt(maxDeg = 7) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !canTilt()) return undefined
    let frame = 0

    const move = (event) => {
      if (event.pointerType === 'touch') return
      const rect = el.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        el.dataset.tilting = ''
        el.style.setProperty('--tilt-x', `${((0.5 - y) * maxDeg * 2).toFixed(2)}deg`)
        el.style.setProperty('--tilt-y', `${((x - 0.5) * maxDeg * 2).toFixed(2)}deg`)
        el.style.setProperty('--glare-x', `${(x * 100).toFixed(1)}%`)
        el.style.setProperty('--glare-y', `${(y * 100).toFixed(1)}%`)
      })
    }

    const leave = () => {
      cancelAnimationFrame(frame)
      delete el.dataset.tilting
      el.style.removeProperty('--tilt-x')
      el.style.removeProperty('--tilt-y')
    }

    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [maxDeg])

  return ref
}
