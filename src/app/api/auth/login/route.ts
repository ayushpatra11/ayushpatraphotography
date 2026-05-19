import { getRequestContext } from '@cloudflare/next-on-pages'
import { signSession, sessionCookieHeader } from '@/lib/auth'
import { json } from '@/lib/response'

export const runtime = 'edge'

export async function POST(request: Request): Promise<Response> {
  try {
    const { env } = getRequestContext()
    const body = await request.json() as { password?: string }
    if (!body.password || body.password !== env.ADMIN_PASSWORD) {
      return json({ error: 'Wrong password' }, { status: 401 })
    }
    const token = await signSession(env.AUTH_SECRET)
    return json({ ok: true }, {
      headers: { 'Set-Cookie': sessionCookieHeader(token) },
    })
  } catch (err) {
    console.error('[auth/login] error:', err)
    return json({ error: 'Login failed' }, { status: 500 })
  }
}
