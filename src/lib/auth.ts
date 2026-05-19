export const COOKIE_NAME = 'ap_studio_session'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

function getCrypto() {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Crypto API not available in this runtime')
  }
  return crypto
}

async function hmacHex(data: string, secret: string): Promise<string> {
  if (!secret) {
    throw new Error('Missing secret for HMAC')
  }

  const subtle = getCrypto().subtle

  const key = await subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const sig = await subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(data),
  )

  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function createSession(secret: string): Promise<string> {
  if (!secret) {
    throw new Error('AUTH_SECRET is missing')
  }

  const ts = Date.now().toString()
  const sig = await hmacHex(`admin:${ts}`, secret)

  return btoa(`${ts}:${sig}`)
}

export async function verifySession(token: string, secret: string): Promise<boolean> {
  try {
    if (!secret) return false

    const decoded = atob(token)
    const colonIdx = decoded.indexOf(':')

    if (colonIdx === -1) return false

    const ts = decoded.slice(0, colonIdx)
    const sig = decoded.slice(colonIdx + 1)

    if (Date.now() - parseInt(ts, 10) > SESSION_DURATION_MS) return false

    const expected = await hmacHex(`admin:${ts}`, secret)

    return sig === expected
  } catch {
    return false
  }
}

export function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}
