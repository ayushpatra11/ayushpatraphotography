import { getRequestContext } from '@cloudflare/next-on-pages'
import { createSession, COOKIE_NAME } from '@/lib/auth'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const { env } = getRequestContext()

    if (!env?.ADMIN_PASSWORD || !env?.AUTH_SECRET) {
      return Response.json(
        { error: 'Missing env configuration' },
        { status: 500 },
      )
    }

    // Safely parse JSON (Edge runtime = unknown type)
    const body = (await request.json()) as { password?: string }
    const password = body?.password

    if (typeof password !== 'string') {
      return Response.json(
        { error: 'Invalid request payload' },
        { status: 400 },
      )
    }

    // Auth check
    if (password !== env.ADMIN_PASSWORD) {
      return Response.json(
        { error: 'Invalid password' },
        { status: 401 },
      )
    }

    // Create session token
    const token = await createSession(env.AUTH_SECRET)

    const maxAge = 7 * 24 * 60 * 60 // 7 days

    return Response.json(
      { success: true },
      {
        headers: {
          'Set-Cookie': `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`,
        },
      },
    )
  } catch (err) {
    console.error('LOGIN_ERROR:', err)

    return Response.json(
      {
        error: 'Server error',
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
}
