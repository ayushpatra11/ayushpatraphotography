import { getRequestContext } from '@cloudflare/next-on-pages'
import { createSession, COOKIE_NAME } from '@/lib/auth'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const { env } = getRequestContext()
    const { password } = (await request.json()) as { password: string }

    if (!password || password !== env.ADMIN_PASSWORD) {
      return Response.json({ error: 'Invalid password' }, { status: 401 })
    }

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
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
