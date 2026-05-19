import { describe, it, expect, vi } from 'vitest'
import { createSession, verifySession, parseCookie, COOKIE_NAME } from './auth'

const SECRET = 'test-secret-32-chars-minimum-xxxxx'

describe('createSession / verifySession', () => {
  it('creates a token that verifies correctly', async () => {
    const token = await createSession(SECRET)
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)
    expect(await verifySession(token, SECRET)).toBe(true)
  })

  it('rejects a token verified with the wrong secret', async () => {
    const token = await createSession(SECRET)
    expect(await verifySession(token, 'different-secret-xxxxxxxxxxxxxxxxx')).toBe(false)
  })

  it('rejects a tampered token (flipped bit in signature)', async () => {
    const token = await createSession(SECRET)
    const decoded = atob(token)
    const colonIdx = decoded.indexOf(':')
    const ts = decoded.slice(0, colonIdx)
    const sig = decoded.slice(colonIdx + 1)
    // Flip the last hex digit
    const lastChar = sig[sig.length - 1]
    const flipped = lastChar === 'f' ? '0' : 'f'
    const tamperedSig = sig.slice(0, -1) + flipped
    const tampered = btoa(`${ts}:${tamperedSig}`)
    expect(await verifySession(tampered, SECRET)).toBe(false)
  })

  it('rejects an expired token', async () => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    const expiredTs = (Date.now() - sevenDaysMs - 1000).toString()

    // Build a valid HMAC for an old timestamp
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`admin:${expiredTs}`))
    const sigHex = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    const expiredToken = btoa(`${expiredTs}:${sigHex}`)

    expect(await verifySession(expiredToken, SECRET)).toBe(false)
  })

  it('rejects garbage input', async () => {
    expect(await verifySession('not-base64!!!', SECRET)).toBe(false)
    expect(await verifySession('', SECRET)).toBe(false)
    expect(await verifySession(btoa('no-colon'), SECRET)).toBe(false)
  })
})

describe('parseCookie', () => {
  it('finds the named cookie when it is the only cookie', () => {
    expect(parseCookie(`${COOKIE_NAME}=abc123`, COOKIE_NAME)).toBe('abc123')
  })

  it('finds the named cookie among multiple cookies', () => {
    const header = `other=xyz; ${COOKIE_NAME}=mytoken; another=1`
    expect(parseCookie(header, COOKIE_NAME)).toBe('mytoken')
  })

  it('returns null when cookie is absent', () => {
    expect(parseCookie('other=xyz; another=1', COOKIE_NAME)).toBeNull()
  })

  it('returns null for an empty header', () => {
    expect(parseCookie('', COOKIE_NAME)).toBeNull()
  })

  it('URL-decodes the cookie value', () => {
    const encoded = encodeURIComponent('value with spaces')
    expect(parseCookie(`${COOKIE_NAME}=${encoded}`, COOKIE_NAME)).toBe('value with spaces')
  })
})

describe('session roundtrip with real token', () => {
  it('a freshly created token is still valid after parsing out of a cookie header', async () => {
    const token = await createSession(SECRET)
    const cookieHeader = `${COOKIE_NAME}=${token}; Path=/`
    const parsed = parseCookie(cookieHeader, COOKIE_NAME)
    expect(parsed).not.toBeNull()
    expect(await verifySession(parsed!, SECRET)).toBe(true)
  })
})
