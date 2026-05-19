import { getRequestContext } from '@cloudflare/next-on-pages'
import { createSession, COOKIE_NAME } from '@/lib/auth'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const { env } = getRequestContext()

    const { password } = await request.json()

    if (!env.ADMIN_PASSWORD || !env.AUTH_SECRET) {
      return Response.json(
        { error: 'Missing env vars' },
        { status: 500 },
      )
    }

    if (password !== env.ADMIN_PASSWORD) {
      return Response.json(
        { error: 'Invalid password' },
        { status: 401 },
      )
    }

    const token = await createSession(env.AUTH_SECRET)

    const maxAge = 7 * 24 * 60 * 60

    return Response.json(
      { success: true },
      {
        headers: {
          'Set-Cookie': `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`,
        },
      },
    )
  } catch (err) {
    console.error(err)

    return Response.json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
}
