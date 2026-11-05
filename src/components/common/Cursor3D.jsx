import { useEffect, useRef } from 'react'

const INTERACTIVE = 'a, button, select, summary, label, [role="switch"], input'
const TEXT_FIELD = 'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea'
const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value))

export function Cursor3D() {
  const ringRef = useRef(null)
  const dotRef = useRef(null)

  useEffect(() => {
    const capable = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!capable || reduced) return undefined

    const root = document.documentElement
    const ring = ringRef.current
    const dot = dotRef.current
    let x = 0
    let y = 0
    let ringX = 0
    let ringY = 0
    let frame = 0
    let visible = false

    // The ring trails the pointer and tips toward the direction of travel.
    const render = () => {
      const dx = x - ringX
      const dy = y - ringY
      ringX += dx * 0.2
      ringY += dy * 0.2
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) perspective(220px) rotateX(${clamp(-dy * 0.9, 55)}deg) rotateY(${clamp(dx * 0.9, 55)}deg)`
      frame = Math.abs(dx) + Math.abs(dy) > 0.15 ? requestAnimationFrame(render) : 0
    }

    const modeFor = (target) => {
      if (document.querySelector('dialog[open]')) return 'native'
      if (!(target instanceof Element)) return 'default'
      if (target.closest('[data-cursor="view"]')) return 'view'
      if (target.closest(TEXT_FIELD)) return 'text'
      if (target.closest(INTERACTIVE)) return 'link'
      return 'default'
    }

    const onMove = (event) => {
      if (event.pointerType === 'touch') return
      x = event.clientX
      y = event.clientY
      if (!visible) {
        visible = true
        ringX = x
        ringY = y
        root.classList.add('cursor-ready')
      }
      const mode = modeFor(event.target)
      root.classList.toggle('has-3d-cursor', mode !== 'native')
      ring.dataset.mode = mode
      dot.dataset.mode = mode
      if (!frame) frame = requestAnimationFrame(render)
    }

    const onDown = () => ring.classList.add('is-pressed')
    const onUp = () => ring.classList.remove('is-pressed')
    const onLeave = () => {
      visible = false
      root.classList.remove('cursor-ready')
    }

    root.classList.add('has-3d-cursor')
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    root.addEventListener('mouseleave', onLeave)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      root.removeEventListener('mouseleave', onLeave)
      root.classList.remove('has-3d-cursor', 'cursor-ready')
    }
  }, [])

  return (
    <div className="cursor" aria-hidden="true">
      <div ref={ringRef} className="cursor__ring">
        <span className="cursor__halo" />
        <span className="cursor__orbit" />
        <span className="cursor__label">View</span>
      </div>
      <div ref={dotRef} className="cursor__dot" />
    </div>
  )
}
