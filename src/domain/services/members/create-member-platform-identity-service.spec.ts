import { describe, expect, it } from 'vitest'
import { DomainError } from '@/domain/errors/domain-error'
import { IdentityAlreadyExists } from '@/domain/errors/identity-already-exists'
import { MemberNotFound } from '@/domain/errors/member-not-found'
import { makeMember } from '@/tests/factories/make-member'
import { createMemberPlatformIdentity } from './create-member-platform-identity-service'

describe('createMemberPlatformIdentity', () => {
  it('should link a platform identity to a member', async () => {
    const member = await makeMember()

    const result = await createMemberPlatformIdentity({
      memberId: member.id,
      provider: 'discord',
      providerUserId: 'discord-user-123',
    })

    expect(result).not.toBeInstanceOf(DomainError)
    if (!(result instanceof DomainError)) {
      expect(result.memberId).toBe(member.id)
      expect(result.provider).toBe('discord')
      expect(result.providerUserId).toBe('discord-user-123')
    }
  })

  it('should return MemberNotFound when member does not exist', async () => {
    const result = await createMemberPlatformIdentity({
      memberId: '00000000-0000-0000-0000-000000000000',
      provider: 'discord',
      providerUserId: 'discord-user-456',
    })

    expect(result).toBeInstanceOf(MemberNotFound)
  })

  it('should return IdentityAlreadyExists when identity is duplicated', async () => {
    const member = await makeMember()

    await createMemberPlatformIdentity({
      memberId: member.id,
      provider: 'discord',
      providerUserId: 'discord-user-789',
    })

    const result = await createMemberPlatformIdentity({
      memberId: member.id,
      provider: 'discord',
      providerUserId: 'discord-user-789',
    })

    expect(result).toBeInstanceOf(IdentityAlreadyExists)
  })
})
