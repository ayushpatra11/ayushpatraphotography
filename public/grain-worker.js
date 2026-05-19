// Runs in a Web Worker so grain generation never touches the main thread.
const TILE = 256
let canvas, ctx, tile, tileCtx, img

function draw() {
  if (!ctx) return
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const v = (Math.random() * 255) | 0
    d[i] = d[i + 1] = d[i + 2] = v
    d[i + 3] = 255
  }
  tileCtx.putImageData(img, 0, 0)

  const ox = -(Math.random() * TILE | 0)
  const oy = -(Math.random() * TILE | 0)
  const cols = Math.ceil((canvas.width - ox) / TILE)
  const rows = Math.ceil((canvas.height - oy) / TILE)
  for (let r = 0; r <= rows; r++)
    for (let c = 0; c <= cols; c++)
      ctx.drawImage(tile, ox + c * TILE, oy + r * TILE)
}

self.onmessage = ({ data }) => {
  if (data.type === 'init') {
    canvas = data.canvas
    canvas.width = data.width
    canvas.height = data.height
    ctx = canvas.getContext('2d')
    tile = new OffscreenCanvas(TILE, TILE)
    tileCtx = tile.getContext('2d')
    img = tileCtx.createImageData(TILE, TILE)
    draw()
    setInterval(draw, 80)
  } else if (data.type === 'resize') {
    if (canvas) { canvas.width = data.width; canvas.height = data.height }
  }
}
