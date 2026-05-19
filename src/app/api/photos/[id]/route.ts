import { getRequestContext } from '@cloudflare/next-on-pages'
import { getManifest, putManifest } from '@/lib/r2'
import { parseCookie, verifySession, COOKIE_NAME } from '@/lib/auth'
import { json } from '@/lib/response'

export const runtime = 'edge'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params
    const { env } = getRequestContext()

    const cookie = request.headers.get('cookie') ?? ''
    const token = parseCookie(cookie, COOKIE_NAME)
    if (!token || !(await verifySession(token, env.AUTH_SECRET))) {
      return json({ error: 'Unauthorized' }, { status: 401 })
    }

    const manifest = await getManifest(env.R2_BUCKET)
    const idx = manifest.photos.findIndex(p => p.id === id)
    if (idx === -1) return json({ error: 'Not found' }, { status: 404 })

    const [removed] = manifest.photos.splice(idx, 1)
    await env.R2_BUCKET.delete(removed.key)
    await putManifest(env.R2_BUCKET, manifest)

    return json({ success: true })
  } catch (err) {
    console.error('[photos/DELETE] error:', err)
    return json({ error: 'Delete failed' }, { status: 500 })
  }
}
