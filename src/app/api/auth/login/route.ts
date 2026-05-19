import { getRequestContext } from '@cloudflare/next-on-pages'
import { createSession, COOKIE_NAME } from '@/lib/auth'
import { json } from '@/lib/response'

export const runtime = 'edge'

export async function POST(request: Request): Promise<Response> {
  try {
    const { env } = getRequestContext()

    if (!env.ADMIN_PASSWORD || !env.AUTH_SECRET) {
      return json(
        { error: 'Studio is not configured. Set ADMIN_PASSWORD and AUTH_SECRET in the Cloudflare Workers dashboard under Settings → Variables and Secrets.' },
        { status: 503 },
      )
    }

    let password: string
    try {
      const body = (await request.json()) as { password?: unknown }
      password = typeof body.password === 'string' ? body.password : ''
    } catch {
      return json({ error: 'Invalid request body.' }, { status: 400 })
    }

    if (!password || password !== env.ADMIN_PASSWORD) {
      return json({ error: 'Wrong password.' }, { status: 401 })
    }

    const token = await createSession(env.AUTH_SECRET)
    const maxAge = 7 * 24 * 60 * 60
    return json(
      { success: true },
      {
        status: 200,
        headers: {
          'Set-Cookie': `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}; Path=/`,
        },
      },
    )
  } catch (err) {
    console.error('[auth/login] error:', err)
    return json({ error: 'Server error. Check Cloudflare Workers logs.' }, { status: 500 })
  }
}
