import { getRequestContext } from '@cloudflare/next-on-pages'
import { parseCookie, verifySession, COOKIE_NAME } from '@/lib/auth'
import { json } from '@/lib/response'

export const runtime = 'edge'

export async function GET(request: Request): Promise<Response> {
  try {
    // Fast path: no cookie → unauthenticated, skip getRequestContext entirely
    const cookieHeader = request.headers.get('cookie') ?? ''
    const token = parseCookie(cookieHeader, COOKIE_NAME)
    if (!token) return json({ authenticated: false }, { status: 401 })

    const { env } = getRequestContext()
    if (!env.AUTH_SECRET) return json({ authenticated: false }, { status: 401 })

    const valid = await verifySession(token, env.AUTH_SECRET)
    return json({ authenticated: valid }, { status: valid ? 200 : 401 })
  } catch (err) {
    console.error('[auth/check] error:', err)
    return json({ authenticated: false }, { status: 401 })
  }
}
