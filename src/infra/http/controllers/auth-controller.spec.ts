import { describe, expect, it, vi } from 'vitest'
import app from '@/infra/http/app'
import { makeMember } from '@/tests/factories/make-member'
import { makeMagicLinkToken } from '@/tests/factories/make-magic-link-token'
import { makeRefreshToken } from '@/tests/factories/make-refresh-token'

vi.mock('@/infra/factories/email-service-factory', () => ({
  createEmailService: () => ({ sendMagicLink: vi.fn().mockResolvedValue(undefined) }),
}))

describe('POST /auth/magic-link', () => {
  it('should return 200 for a valid email', async () => {
    const member = await makeMember()

    const response = await app.inject({
      method: 'POST',
      url: '/auth/magic-link',
      payload: { email: member.email },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ message: 'Magic link sent' })
  })

  it('should return 200 even for an unknown email (auto-registers)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/magic-link',
      payload: { email: `new-${Date.now()}@example.com` },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ message: 'Magic link sent' })
  })

  it('should return 400 for an invalid email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/magic-link',
      payload: { email: 'not-an-email' },
    })

    expect(response.statusCode).toBe(400)
  })
})

describe('POST /auth/verify', () => {
  it('should return tokens and member for a valid token', async () => {
    const member = await makeMember()
    const { token } = await makeMagicLinkToken({ memberId: member.id })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/verify',
      payload: { token },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.accessToken).toBeDefined()
    expect(body.refreshToken).toBeDefined()
    expect(body.member.id).toBe(member.id)
  })

  it('should return 401 for an invalid token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/verify',
      payload: { token: 'invalid-token' },
    })

    expect(response.statusCode).toBe(401)
    expect(JSON.parse(response.body)).toEqual({ message: 'Invalid token' })
  })

  it('should return 401 for an expired token', async () => {
    const member = await makeMember()
    const { token } = await makeMagicLinkToken({
      memberId: member.id,
      expiresAt: new Date(Date.now() - 1000),
    })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/verify',
      payload: { token },
    })

    expect(response.statusCode).toBe(401)
    expect(JSON.parse(response.body)).toEqual({ message: 'Token expired' })
  })
})

describe('POST /auth/refresh', () => {
  it('should return a new access token for a valid refresh token', async () => {
    const member = await makeMember()
    const { token: refreshToken } = await makeRefreshToken({ memberId: member.id })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: { refreshToken },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).accessToken).toBeDefined()
  })

  it('should return 401 for invalid refresh token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: { refreshToken: 'bad-token' },
    })

    expect(response.statusCode).toBe(401)
  })
})

describe('POST /auth/logout', () => {
  it('should revoke the refresh token', async () => {
    const member = await makeMember()
    const { token: refreshToken } = await makeRefreshToken({ memberId: member.id })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      payload: { refreshToken },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ message: 'Logged out' })
  })

  it('should return 401 for unknown refresh token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      payload: { refreshToken: 'unknown-token' },
    })

    expect(response.statusCode).toBe(401)
  })
})
