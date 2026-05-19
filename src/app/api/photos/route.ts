import { getRequestContext } from '@cloudflare/next-on-pages'
import { getManifest, putManifest } from '@/lib/r2'
import { json } from '@/lib/response'
import { verifySession, getSessionCookie } from '@/lib/auth'
import type { PhotoMeta } from '@/types'

export const runtime = 'edge'

export async function GET(): Promise<Response> {
  try {
    const { env } = getRequestContext()
    const manifest = await getManifest(env.R2_BUCKET)
    const photos = manifest.photos.sort((a, b) => b.uploadedAt - a.uploadedAt)
    return json({ photos })
  } catch (err) {
    console.error('[photos/GET] error:', err)
    return json({ photos: [] })
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { env } = getRequestContext()

    const token = getSessionCookie(request)
    if (!token || !(await verifySession(token, env.AUTH_SECRET))) {
      return json({ error: 'Authentication required' }, { status: 401 })
    }

    const formData = await request.formData()
    const image = formData.get('image') as File | null
    if (!image) return json({ error: 'No image provided' }, { status: 400 })

    const id = crypto.randomUUID()
    // Store at photos/{id} (no extension) — content-type lives in R2 httpMetadata.
    // The image route can fetch it with a single R2 GET, no manifest lookup needed.
    const key = `photos/${id}`

    await env.R2_BUCKET.put(key, await image.arrayBuffer(), {
      httpMetadata: { contentType: image.type },
    })

    // Store thumbnail if the client sent one (resized WebP)
    const thumb = formData.get('thumb') as File | null
    if (thumb) {
      await env.R2_BUCKET.put(`${key}.t`, await thumb.arrayBuffer(), {
        httpMetadata: { contentType: 'image/webp' },
      })
    }

    const tagsRaw = (formData.get('tags') as string) ?? ''
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
    const lqip = (formData.get('lqip') as string | null) ?? undefined

    const photo: PhotoMeta = {
      id,
      key,
      contentType: image.type,
      caption: (formData.get('caption') as string) ?? '',
      location: (formData.get('location') as string) ?? '',
      date: (formData.get('date') as string) ?? '',
      device: (formData.get('device') as string) ?? '',
      tags,
      uploadedAt: Date.now(),
      ...(lqip && { lqip }),
    }

    const manifest = await getManifest(env.R2_BUCKET)
    manifest.photos.push(photo)
    await putManifest(env.R2_BUCKET, manifest)

    return json({ photo }, { status: 201 })
  } catch (err) {
    console.error('[photos/POST] error:', err)
    return json({ error: 'Upload failed' }, { status: 500 })
  }
}
