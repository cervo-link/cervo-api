import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { MemberNotFound } from '@/domain/errors/member-not-found'
import { makeMember } from '@/tests/factories/make-member'
import { findMemberByPlatform } from './find-member-by-platform-service'

describe('findMemberByPlatform', () => {
  it('should find a member by memberId', async () => {
    const createdMember = await makeMember()

    const result = await findMemberByPlatform({ memberId: createdMember.id })

    expect(result).toEqual(createdMember)
  })

  it('should return MemberNotFound when memberId is not provided', async () => {
    const result = await findMemberByPlatform({})

    expect(result).toBeInstanceOf(MemberNotFound)
  })

  it('should return MemberNotFound when member does not exist', async () => {
    const result = await findMemberByPlatform({ memberId: randomUUID() })

    expect(result).toBeInstanceOf(MemberNotFound)
  })
})
