import { getRequestContext } from '@cloudflare/next-on-pages'
import { getManifest, putManifest } from '@/lib/r2'
import { json } from '@/lib/response'
import { verifySession, getSessionCookie } from '@/lib/auth'

export const runtime = 'edge'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { env } = getRequestContext()

    const token = getSessionCookie(request)
    if (!token || !(await verifySession(token, env.AUTH_SECRET))) {
      return json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params
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
