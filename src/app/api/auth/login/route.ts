import { getRequestContext } from '@cloudflare/next-on-pages'
import { createSession, COOKIE_NAME } from '@/lib/auth'

export const runtime = 'edge'

export async function POST(request: Request) {
  let env: { ADMIN_PASSWORD?: string; AUTH_SECRET?: string }

  try {
    env = getRequestContext().env
  } catch {
    return Response.json(
      { error: 'Studio is not configured yet. Set ADMIN_PASSWORD and AUTH_SECRET in the Cloudflare dashboard.' },
      { status: 503 },
    )
  }

  if (!env.ADMIN_PASSWORD || !env.AUTH_SECRET) {
    return Response.json(
      { error: 'Studio environment variables are missing. Set ADMIN_PASSWORD and AUTH_SECRET in the Cloudflare Workers dashboard.' },
      { status: 503 },
    )
  }

  let password: string
  try {
    const body = (await request.json()) as { password?: unknown }
    password = typeof body.password === 'string' ? body.password : ''
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!password || password !== env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Wrong password.' }, { status: 401 })
  }

  try {
    const token = await createSession(env.AUTH_SECRET)
    const maxAge = 7 * 24 * 60 * 60
    return Response.json(
      { success: true },
      {
        headers: {
          'Set-Cookie': `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}; Path=/`,
        },
      },
    )
  } catch {
    return Response.json({ error: 'Failed to create session.' }, { status: 500 })
  }
}
