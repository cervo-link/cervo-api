import { describe, expect, it } from 'vitest'
import { InvalidToken } from '@/domain/errors/invalid-token'
import { TokenExpired } from '@/domain/errors/token-expired'
import { makeMember } from '@/tests/factories/make-member'
import { makeMagicLinkToken } from '@/tests/factories/make-magic-link-token'
import { verifyMagicLink } from './verify-magic-link-service'

describe('verifyMagicLink', () => {
  it('should return tokens and member for a valid token', async () => {
    const member = await makeMember()
    const { token } = await makeMagicLinkToken({ memberId: member.id })

    const result = await verifyMagicLink(token)

    expect(result).not.toBeInstanceOf(InvalidToken)
    expect(result).not.toBeInstanceOf(TokenExpired)
    if ('accessToken' in result) {
      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.member.id).toBe(member.id)
    }
  })

  it('should auto-create a workspace for a member without one', async () => {
    const member = await makeMember()
    const { token } = await makeMagicLinkToken({ memberId: member.id })

    const result = await verifyMagicLink(token)

    expect(result).not.toBeInstanceOf(InvalidToken)
  })

  it('should return InvalidToken for unknown token', async () => {
    const result = await verifyMagicLink('nonexistent-token')
    expect(result).toBeInstanceOf(InvalidToken)
  })

  it('should return InvalidToken for already-used token', async () => {
    const member = await makeMember()
    const { token } = await makeMagicLinkToken({ memberId: member.id })

    await verifyMagicLink(token)
    const result = await verifyMagicLink(token)

    expect(result).toBeInstanceOf(InvalidToken)
  })

  it('should return TokenExpired for an expired token', async () => {
    const member = await makeMember()
    const { token } = await makeMagicLinkToken({
      memberId: member.id,
      expiresAt: new Date(Date.now() - 1000),
    })

    const result = await verifyMagicLink(token)

    expect(result).toBeInstanceOf(TokenExpired)
  })
})
