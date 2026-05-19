import { getRequestContext } from '@cloudflare/next-on-pages'
import { verifySession, getSessionCookie } from '@/lib/auth'
import { json } from '@/lib/response'

export const runtime = 'edge'

export async function GET(request: Request): Promise<Response> {
  try {
    const { env } = getRequestContext()
    const token = getSessionCookie(request)
    if (!token) return json({ authenticated: false }, { status: 401 })
    const valid = await verifySession(token, env.AUTH_SECRET)
    if (!valid) return json({ authenticated: false }, { status: 401 })
    return json({ authenticated: true })
  } catch (err) {
    console.error('[auth/check] error:', err)
    return json({ authenticated: false }, { status: 401 })
  }
}
