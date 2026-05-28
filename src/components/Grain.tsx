'use client'

import { useEffect, useRef } from 'react'

const TILE = 256

export default function Grain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Use OffscreenCanvas + Worker when available so grain generation
    // runs completely off the main thread and can't jank cursor/scroll.
    if (typeof OffscreenCanvas !== 'undefined' && 'transferControlToOffscreen' in canvas) {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      const offscreen = canvas.transferControlToOffscreen()
      const worker = new Worker('/grain-worker.js')
      worker.postMessage({ type: 'init', canvas: offscreen, width: canvas.width, height: canvas.height }, [offscreen])

      const onResize = () => worker.postMessage({ type: 'resize', width: window.innerWidth, height: window.innerHeight })
      window.addEventListener('resize', onResize, { passive: true })
      return () => { window.removeEventListener('resize', onResize); worker.terminate() }
    }

    // Fallback for browsers without OffscreenCanvas
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const offscreen = document.createElement('canvas')
    offscreen.width = TILE; offscreen.height = TILE
    const off = offscreen.getContext('2d')!

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    const draw = () => {
      if (document.hidden) return
      const img = off.createImageData(TILE, TILE)
      const d = img.data
      for (let i = 0; i < d.length; i += 4) { const v = (Math.random() * 255) | 0; d[i] = d[i+1] = d[i+2] = v; d[i+3] = 255 }
      off.putImageData(img, 0, 0)
      const ox = -(Math.random() * TILE | 0), oy = -(Math.random() * TILE | 0)
      const cols = Math.ceil((canvas.width - ox) / TILE), rows = Math.ceil((canvas.height - oy) / TILE)
      for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) ctx.drawImage(offscreen, ox + c * TILE, oy + r * TILE)
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })
    draw()
    const interval = setInterval(draw, 80)
    return () => { window.removeEventListener('resize', resize); clearInterval(interval) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999, opacity: 0.032, mixBlendMode: 'screen' }}
      aria-hidden="true"
    />
  )
}
