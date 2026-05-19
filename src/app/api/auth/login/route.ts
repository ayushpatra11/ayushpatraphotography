import { getRequestContext } from '@cloudflare/next-on-pages'
import { signSession, sessionCookieHeader } from '@/lib/auth'
import { json } from '@/lib/response'

export const runtime = 'edge'

export async function POST(request: Request): Promise<Response> {
  try {
    const { env } = getRequestContext()

    // Distinguish misconfiguration from wrong password so the server-side
    // logs are useful and the client gets a meaningful status code.
    if (!env.ADMIN_PASSWORD) {
      console.error('[auth/login] ADMIN_PASSWORD secret is not set in Cloudflare Pages environment variables')
      return json({ error: 'Server not configured: missing ADMIN_PASSWORD' }, { status: 503 })
    }
    if (!env.AUTH_SECRET) {
      console.error('[auth/login] AUTH_SECRET secret is not set in Cloudflare Pages environment variables')
      return json({ error: 'Server not configured: missing AUTH_SECRET' }, { status: 503 })
    }

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
