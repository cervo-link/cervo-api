import { describe, expect, it } from 'vitest'
import { InvalidToken } from '@/domain/errors/invalid-token'
import { TokenExpired } from '@/domain/errors/token-expired'
import { makeMember } from '@/tests/factories/make-member'
import { makeRefreshToken } from '@/tests/factories/make-refresh-token'
import { revokeRefreshToken } from '@/infra/db/repositories/refresh-tokens-repository'
import { refreshAccessToken } from './refresh-token-service'

describe('refreshAccessToken', () => {
  it('should return a new access token for a valid refresh token', async () => {
    const member = await makeMember()
    const { token } = await makeRefreshToken({ memberId: member.id })

    const result = await refreshAccessToken(token)

    expect(result).not.toBeInstanceOf(InvalidToken)
    if ('accessToken' in result) {
      expect(result.accessToken).toBeDefined()
    }
  })

  it('should return InvalidToken for unknown token', async () => {
    const result = await refreshAccessToken('unknown-token')
    expect(result).toBeInstanceOf(InvalidToken)
  })

  it('should return InvalidToken for revoked token', async () => {
    const member = await makeMember()
    const refreshToken = await makeRefreshToken({ memberId: member.id })
    await revokeRefreshToken(refreshToken.id)

    const result = await refreshAccessToken(refreshToken.token)
    expect(result).toBeInstanceOf(InvalidToken)
  })

  it('should return TokenExpired for expired token', async () => {
    const member = await makeMember()
    const { token } = await makeRefreshToken({
      memberId: member.id,
      expiresAt: new Date(Date.now() - 1000),
    })

    const result = await refreshAccessToken(token)
    expect(result).toBeInstanceOf(TokenExpired)
  })
})
