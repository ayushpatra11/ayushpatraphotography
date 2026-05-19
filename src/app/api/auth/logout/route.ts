import { COOKIE_NAME } from '@/lib/auth'
import { json } from '@/lib/response'

export const runtime = 'edge'

export async function POST(): Promise<Response> {
  return json(
    { success: true },
    {
      status: 200,
      headers: {
        'Set-Cookie': `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`,
      },
    },
  )
}
