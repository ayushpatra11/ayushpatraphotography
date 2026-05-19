import { getRequestContext } from '@cloudflare/next-on-pages'
import { createSession, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { env } = getRequestContext()

    console.log({
      hasPassword: !!env.ADMIN_PASSWORD,
      hasSecret: !!env.AUTH_SECRET,
    })

    const { password } = (await request.json()) as { password: string }

    if (!password || password !== env.ADMIN_PASSWORD) {
      return Response.json({ error: 'Invalid password' }, { status: 401 })
    }

    const token = await createSession(env.AUTH_SECRET)

    return Response.json({ success: true })
  } catch (err) {
    console.error(err)

    return Response.json(
      {
        error: 'Server error',
        details: String(err),
      },
      { status: 500 },
    )
  }
}
