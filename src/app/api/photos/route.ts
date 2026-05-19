import { getRequestContext } from '@cloudflare/next-on-pages'
import { getManifest, putManifest, extFromMime } from '@/lib/r2'
import { json } from '@/lib/response'
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

    const formData = await request.formData()
    const image = formData.get('image') as File | null
    if (!image) return json({ error: 'No image provided' }, { status: 400 })

    const id = crypto.randomUUID()
    const ext = extFromMime(image.type)
    const key = `photos/${id}.${ext}`

    await env.R2_BUCKET.put(key, await image.arrayBuffer(), {
      httpMetadata: { contentType: image.type },
    })

    const tagsRaw = (formData.get('tags') as string) ?? ''
    const tags = tagsRaw
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

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
