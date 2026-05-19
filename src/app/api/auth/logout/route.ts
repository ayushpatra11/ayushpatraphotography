import { COOKIE_NAME } from '@/lib/auth'

export const runtime = 'edge'

export async function POST() {
  return Response.json(
    { success: true },
    {
      headers: {
        'Set-Cookie': `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`,
      },
    },
  )
}
