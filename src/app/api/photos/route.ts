import { getRequestContext } from '@cloudflare/next-on-pages'
import { getManifest, putManifest, extFromMime } from '@/lib/r2'
import { parseCookie, verifySession, COOKIE_NAME } from '@/lib/auth'
import type { PhotoMeta } from '@/types'

export const runtime = 'edge'

export async function GET() {
  try {
    const { env } = getRequestContext()
    const manifest = await getManifest(env.R2_BUCKET)
    const photos = manifest.photos.sort((a, b) => b.uploadedAt - a.uploadedAt)
    return Response.json({ photos })
  } catch {
    return Response.json({ photos: [] })
  }
}

export async function POST(request: Request) {
  try {
    const { env } = getRequestContext()

    const cookie = request.headers.get('cookie') ?? ''
    const token = parseCookie(cookie, COOKIE_NAME)
    if (!token || !(await verifySession(token, env.AUTH_SECRET))) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const image = formData.get('image') as File | null
    if (!image) return Response.json({ error: 'No image provided' }, { status: 400 })

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

    return Response.json({ photo }, { status: 201 })
  } catch (err) {
    console.error('Upload error:', err)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
