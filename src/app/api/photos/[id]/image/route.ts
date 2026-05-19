import { getRequestContext } from '@cloudflare/next-on-pages'
import { getManifest } from '@/lib/r2'

export const runtime = 'edge'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { env } = getRequestContext()
    const manifest = await getManifest(env.R2_BUCKET)
    const photo = manifest.photos.find(p => p.id === params.id)
    if (!photo) return new Response('Not found', { status: 404 })

    const obj = await env.R2_BUCKET.get(photo.key)
    if (!obj) return new Response('Not found', { status: 404 })

    return new Response(obj.body, {
      headers: {
        'Content-Type': photo.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new Response('Error', { status: 500 })
  }
}
