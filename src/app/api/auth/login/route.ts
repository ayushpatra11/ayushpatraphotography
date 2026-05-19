import { getRequestContext } from '@cloudflare/next-on-pages'
import { createSession, COOKIE_NAME } from '@/lib/auth'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const ctx = getRequestContext()
    const env = ctx?.env

    // 1. Debug env availability
    if (!env) {
      return Response.json({
        step: 'env',
        ok: false,
        error: 'No Cloudflare env found',
      })
    }

    // 2. Check secrets explicitly
    const hasPassword = !!env.ADMIN_PASSWORD
    const hasSecret = !!env.AUTH_SECRET

    if (!hasPassword || !hasSecret) {
      return Response.json({
        step: 'env_check',
        ok: false,
        hasPassword,
        hasSecret,
      })
    }

    // 3. Parse request safely
    let body: any
    try {
      body = await request.json()
    } catch (e) {
      return Response.json({
        step: 'body_parse',
        ok: false,
        error: 'Invalid JSON body',
      })
    }

    const password = body?.password

    if (typeof password !== 'string') {
      return Response.json({
        step: 'validation',
        ok: false,
        error: 'password missing or not string',
        received: body,
      })
    }

    // 4. Password check
    if (password !== env.ADMIN_PASSWORD) {
      return Response.json({
        step: 'auth',
        ok: false,
        error: 'Invalid password',
      })
    }

    // 5. Session creation (MOST LIKELY FAILURE POINT)
    let token: string
    try {
      token = await createSession(env.AUTH_SECRET)
    } catch (e: any) {
      return Response.json({
        step: 'session_creation',
        ok: false,
        error: e?.message ?? String(e),
      })
    }

    // 6. Success
    const maxAge = 7 * 24 * 60 * 60

    return Response.json(
      {
        step: 'success',
        ok: true,
      },
      {
        headers: {
          'Set-Cookie': `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`,
        },
      },
    )
  } catch (err: any) {
    return Response.json({
      step: 'global_catch',
      ok: false,
      error: err?.message ?? String(err),
    })
  }
}
