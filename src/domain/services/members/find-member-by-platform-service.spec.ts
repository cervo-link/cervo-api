import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { MemberNotFound } from '@/domain/errors/member-not-found'
import { makeMember } from '@/tests/factories/make-member'
import { findMemberByPlatform } from './find-member-by-platform-service'

const uniqueId = () => randomUUID()

describe('findMemberByPlatform', () => {
  it('should find a member by discordId when platform is discord', async () => {
    const discordUserId = uniqueId()
    const createdMember = await makeMember({ discordUserId })

    const result = await findMemberByPlatform({
      platform: 'discord',
      discordId: discordUserId,
    })

    expect(result).toEqual(createdMember)
  })

  it('should find a member by userId when platform is not discord', async () => {
    const createdMember = await makeMember()

    const result = await findMemberByPlatform({
      platform: 'slack',
      userId: createdMember.id,
    })

    expect(result).toEqual(createdMember)
  })

  it('should return MemberNotFound when discordId is not provided for discord platform', async () => {
    const result = await findMemberByPlatform({
      platform: 'discord',
    })

    expect(result).toBeInstanceOf(MemberNotFound)
  })

  it('should return MemberNotFound when userId is not provided for non-discord platform', async () => {
    const result = await findMemberByPlatform({
      platform: 'slack',
    })

    expect(result).toBeInstanceOf(MemberNotFound)
  })

  it('should return MemberNotFound when member does not exist with discordId', async () => {
    const result = await findMemberByPlatform({
      platform: 'discord',
      discordId: uniqueId(),
    })

    expect(result).toBeInstanceOf(MemberNotFound)
  })

  it('should return MemberNotFound when member does not exist with userId', async () => {
    const result = await findMemberByPlatform({
      platform: 'telegram',
      userId: uniqueId(),
    })

    expect(result).toBeInstanceOf(MemberNotFound)
  })
})
