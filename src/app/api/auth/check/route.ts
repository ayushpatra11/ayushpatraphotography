import { getRequestContext } from '@cloudflare/next-on-pages'
import { parseCookie, verifySession, COOKIE_NAME } from '@/lib/auth'

export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    const { env } = getRequestContext()
    const cookie = request.headers.get('cookie') ?? ''
    const token = parseCookie(cookie, COOKIE_NAME)
    if (!token || !(await verifySession(token, env.AUTH_SECRET))) {
      return Response.json({ authenticated: false }, { status: 401 })
    }
    return Response.json({ authenticated: true })
  } catch {
    return Response.json({ authenticated: false }, { status: 401 })
  }
}
