'use client'

import { useEffect, useRef } from 'react'

const TILE = 256

export default function Grain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const offscreen = document.createElement('canvas')
    offscreen.width = TILE
    offscreen.height = TILE
    const off = offscreen.getContext('2d')!

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    function draw() {
      if (!canvas || !ctx || document.hidden) return

      // Fill a small tile with random noise (CPU-only work is 256×256 = 65K pixels)
      const img = off.createImageData(TILE, TILE)
      const d = img.data
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0
        d[i] = d[i + 1] = d[i + 2] = v
        d[i + 3] = 255
      }
      off.putImageData(img, 0, 0)

      // Tile the offscreen canvas across the full screen via GPU drawImage calls.
      // Random offset each frame makes repeats imperceptible.
      const ox = -(Math.random() * TILE | 0)
      const oy = -(Math.random() * TILE | 0)
      const cols = Math.ceil((canvas.width - ox) / TILE)
      const rows = Math.ceil((canvas.height - oy) / TILE)
      for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= cols; col++) {
          ctx.drawImage(offscreen, ox + col * TILE, oy + row * TILE)
        }
      }
    }

    resize()
    window.addEventListener('resize', resize, { passive: true })
    draw()
    // 12fps is plenty for film grain — no need to run at 60fps
    const interval = setInterval(draw, 80)

    return () => {
      window.removeEventListener('resize', resize)
      clearInterval(interval)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: 0.032,
        mixBlendMode: 'screen',
      }}
      aria-hidden="true"
    />
  )
}
