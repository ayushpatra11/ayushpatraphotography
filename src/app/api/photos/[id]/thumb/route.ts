import { getRequestContext } from '@cloudflare/next-on-pages'
import { getManifest } from '@/lib/r2'

export const runtime = 'edge'

const CACHE = 'public, max-age=31536000, immutable'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { env } = getRequestContext()

    // Try thumbnail first (photos/{id}.t)
    const thumb = await env.R2_BUCKET.get(`photos/${id}.t`)
    if (thumb) {
      return new Response(thumb.body, {
        headers: { 'Content-Type': 'image/webp', 'Cache-Control': CACHE },
      })
    }

    // No thumbnail — serve the full image (single read for new uploads)
    const full = await env.R2_BUCKET.get(`photos/${id}`)
    if (full) {
      return new Response(full.body, {
        headers: {
          'Content-Type': full.httpMetadata?.contentType ?? 'image/jpeg',
          'Cache-Control': CACHE,
        },
      })
    }

    // Last resort: old format uploads, look up key in manifest
    const manifest = await getManifest(env.R2_BUCKET)
    const photo = manifest.photos.find(p => p.id === id)
    if (!photo) return new Response('Not found', { status: 404 })

    const obj = await env.R2_BUCKET.get(photo.key)
    if (!obj) return new Response('Not found', { status: 404 })

    return new Response(obj.body, {
      headers: { 'Content-Type': photo.contentType, 'Cache-Control': CACHE },
    })
  } catch {
    return new Response('Error', { status: 500 })
  }
}
