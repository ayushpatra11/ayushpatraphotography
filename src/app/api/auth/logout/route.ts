import { clearSessionCookieHeader } from '@/lib/auth'
import { json } from '@/lib/response'

export const runtime = 'edge'

export async function POST(): Promise<Response> {
  return json({ ok: true }, {
    headers: { 'Set-Cookie': clearSessionCookieHeader() },
  })
}
