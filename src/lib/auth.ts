export const SESSION_COOKIE = 'studio_session'
const SESSION_MAX_AGE_S = 7 * 24 * 60 * 60

export async function signSession(secret: string): Promise<string> {
  const ts = Date.now().toString()
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ts))
  const hex = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return `${ts}.${hex}`
}

export async function verifySession(token: string, secret: string): Promise<boolean> {
  const dot = token.indexOf('.')
  if (dot === -1) return false
  const ts = token.slice(0, dot)
  const hex = token.slice(dot + 1)
  const age = Date.now() - Number(ts)
  if (age < 0 || age > SESSION_MAX_AGE_S * 1000) return false
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const sigBytes = new Uint8Array((hex.match(/.{2}/g) ?? []).map(b => parseInt(b, 16)))
  return crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(ts))
}

export function getSessionCookie(request: Request): string | null {
  const cookie = request.headers.get('cookie') ?? ''
  const match = cookie.match(/(?:^|;\s*)studio_session=([^;]+)/)
  return match ? match[1] : null
}

export function sessionCookieHeader(token: string): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_MAX_AGE_S}`
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
}
