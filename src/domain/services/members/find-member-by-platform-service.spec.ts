import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { MemberNotFound } from '@/domain/errors/member-not-found'
import { makeMember } from '@/tests/factories/make-member'
import { makeMemberPlatformIdentity } from '@/tests/factories/make-member-platform-identity'
import { findMemberByPlatform } from './find-member-by-platform-service'

describe('findMemberByPlatform — memberId lookup', () => {
  it('should find a member by memberId', async () => {
    const member = await makeMember()
    const result = await findMemberByPlatform({ memberId: member.id })
    expect(result).toEqual(member)
  })

  it('should return MemberNotFound when member does not exist', async () => {
    const result = await findMemberByPlatform({ memberId: randomUUID() })
    expect(result).toBeInstanceOf(MemberNotFound)
  })
})

describe('findMemberByPlatform — provider identity lookup', () => {
  it('should find a member via provider identity', async () => {
    const member = await makeMember()
    const identity = await makeMemberPlatformIdentity({ memberId: member.id })

    const result = await findMemberByPlatform({
      provider: identity.provider,
      providerUserId: identity.providerUserId,
    })

    expect(result).not.toBeInstanceOf(MemberNotFound)
    if (!('message' in result)) {
      expect(result.id).toBe(member.id)
    }
  })

  it('should return MemberNotFound for unknown provider identity', async () => {
    const result = await findMemberByPlatform({
      provider: 'discord',
      providerUserId: 'unknown-user',
    })
    expect(result).toBeInstanceOf(MemberNotFound)
  })
})
