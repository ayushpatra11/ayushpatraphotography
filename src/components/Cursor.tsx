'use client'

import { useEffect, useRef } from 'react'

export default function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ring = ringRef.current
    const dot = dotRef.current
    if (!ring || !dot) return

    let mx = 0, my = 0, rx = 0, ry = 0
    let raf = 0
    let settled = true

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const tick = () => {
      rx = lerp(rx, mx, 0.11)
      ry = lerp(ry, my, 0.11)
      ring.style.transform = `translate(calc(${rx}px - 50%), calc(${ry}px - 50%))`
      // Stop the RAF loop once the ring has caught up — no wasted frames
      if (Math.abs(rx - mx) < 0.5 && Math.abs(ry - my) < 0.5) {
        settled = true
        raf = 0
        return
      }
      raf = requestAnimationFrame(tick)
    }

    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      dot.style.transform = `translate(calc(${mx}px - 50%), calc(${my}px - 50%))`
      if (settled) {
        settled = false
        raf = requestAnimationFrame(tick)
      }
    }

    // Event delegation — one listener pair instead of N per-element listeners
    // plus no MutationObserver polling the entire DOM tree
    const onOver = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest('a, button, .gallery-item')) {
        document.body.classList.add('cursor-hover')
      }
    }
    const onOut = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest('a, button, .gallery-item')) {
        document.body.classList.remove('cursor-hover')
      }
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div ref={ringRef} className="cursor-ring" />
      <div ref={dotRef} className="cursor-dot" />
    </>
  )
}
