import assert from 'node:assert'
import { describe, expect, it } from 'vitest'
import { IdentityAlreadyExists } from '@/domain/errors/identity-already-exists'
import { MemberNotFound } from '@/domain/errors/member-not-found'
import { DomainError } from '@/domain/errors/domain-error'
import { makeMember } from '@/tests/factories/make-member'
import { createMemberPlatformIdentity } from './create-member-platform-identity-service'

describe('createMemberPlatformIdentity', () => {
  it('should link a platform identity to a member', async () => {
    const member = await makeMember()
    const providerUserId = `discord-user-${Date.now()}`

    const result = await createMemberPlatformIdentity({
      memberId: member.id,
      provider: 'discord',
      providerUserId,
    })

    assert(!(result instanceof DomainError))
    expect(result.memberId).toBe(member.id)
    expect(result.provider).toBe('discord')
    expect(result.providerUserId).toBe(providerUserId)
  })

  it('should return MemberNotFound when member does not exist', async () => {
    const result = await createMemberPlatformIdentity({
      memberId: '00000000-0000-0000-0000-000000000000',
      provider: 'discord',
      providerUserId: `discord-notfound-${Date.now()}`,
    })

    expect(result).toBeInstanceOf(MemberNotFound)
  })

  it('should return IdentityAlreadyExists when identity is duplicated', async () => {
    const member = await makeMember()
    const providerUserId = `discord-dup-${Date.now()}`

    await createMemberPlatformIdentity({
      memberId: member.id,
      provider: 'discord',
      providerUserId,
    })

    const result = await createMemberPlatformIdentity({
      memberId: member.id,
      provider: 'discord',
      providerUserId,
    })

    expect(result).toBeInstanceOf(IdentityAlreadyExists)
  })
})
