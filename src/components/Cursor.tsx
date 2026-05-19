'use client'

import { useEffect, useRef } from 'react'

export default function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ring = ringRef.current
    const dot = dotRef.current
    if (!ring || !dot) return

    // Re-bind after the null guard so nested function declarations
    // see HTMLDivElement instead of HTMLDivElement | null.
    const r = ring
    const d = dot

    let mx = 0, my = 0, rx = 0, ry = 0
    let raf: number

    function onMove(e: MouseEvent) {
      mx = e.clientX
      my = e.clientY
      d.style.transform = `translate(calc(${mx}px - 50%), calc(${my}px - 50%))`
    }

    function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

    function tick() {
      rx = lerp(rx, mx, 0.11)
      ry = lerp(ry, my, 0.11)
      r.style.transform = `translate(calc(${rx}px - 50%), calc(${ry}px - 50%))`
      raf = requestAnimationFrame(tick)
    }

    function attachHovers() {
      document.querySelectorAll<HTMLElement>('a, button, .gallery-item').forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'))
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'))
      })
    }

    document.addEventListener('mousemove', onMove)
    tick()
    attachHovers()

    // Re-attach on DOM mutations (new gallery items)
    const observer = new MutationObserver(attachHovers)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  return (
    <>
      <div ref={ringRef} className="cursor-ring" />
      <div ref={dotRef} className="cursor-dot" />
    </>
  )
}
