import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import { MemberNotFound } from '@/domain/errors/member-not-found'
import { NotAShadowMember } from '@/domain/errors/not-a-shadow-member'
import { findIdentitiesByMemberId } from '@/infra/db/repositories/member-platform-identities-repository'
import { findById } from '@/infra/db/repositories/members-repository'
import { makeBookmark } from '@/tests/factories/make-bookmark'
import { makeMember } from '@/tests/factories/make-member'
import { makeMemberPlatformIdentity } from '@/tests/factories/make-member-platform-identity'
import { makeMembership } from '@/tests/factories/make-membership'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { mergeMembers } from './merge-members-service'

describe('mergeMembers', () => {
  it('should migrate bookmarks from shadow member to real member', async () => {
    const real = await makeMember()
    const shadow = await makeMember({ email: null, username: null, userId: null })
    const workspace = await makeWorkspace({ ownerId: real.id })

    await makeBookmark({ workspaceId: workspace.id, memberId: shadow.id })
    await makeBookmark({ workspaceId: workspace.id, memberId: shadow.id })

    const result = await mergeMembers(shadow.id, real.id)

    expect(result).toBeNull()
  })

  it('should migrate memberships from shadow to real member', async () => {
    const real = await makeMember()
    const shadow = await makeMember({ email: null, username: null, userId: null })
    const workspace = await makeWorkspace({ ownerId: real.id })

    await makeMembership(workspace.id, shadow.id)

    const result = await mergeMembers(shadow.id, real.id)

    expect(result).toBeNull()
  })

  it('should skip memberships where real member is already a member', async () => {
    const real = await makeMember()
    const shadow = await makeMember({ email: null, username: null, userId: null })
    const workspace = await makeWorkspace({ ownerId: real.id })

    await makeMembership(workspace.id, real.id)
    await makeMembership(workspace.id, shadow.id)

    const result = await mergeMembers(shadow.id, real.id)

    expect(result).toBeNull()
  })

  it('should delete shadow member and its identities after merge', async () => {
    const real = await makeMember()
    const shadow = await makeMember({ email: null, username: null, userId: null })
    await makeMemberPlatformIdentity({ memberId: shadow.id, provider: 'discord' })

    await mergeMembers(shadow.id, real.id)

    const deletedMember = await findById(shadow.id)
    expect(deletedMember).toBeNull()

    const remainingIdentities = await findIdentitiesByMemberId(shadow.id)
    expect(remainingIdentities).toHaveLength(0)
  })

  it('should return NotAShadowMember when shadow has a userId', async () => {
    const real = await makeMember()
    const notShadow = await makeMember({ userId: faker.string.uuid() })

    const result = await mergeMembers(notShadow.id, real.id)

    expect(result).toBeInstanceOf(NotAShadowMember)
  })

  it('should return MemberNotFound when shadowMemberId does not exist', async () => {
    const real = await makeMember()

    const result = await mergeMembers('00000000-0000-0000-0000-000000000000', real.id)

    expect(result).toBeInstanceOf(MemberNotFound)
  })

  it('should return MemberNotFound when realMemberId does not exist', async () => {
    const shadow = await makeMember({ email: null, username: null, userId: null })

    const result = await mergeMembers(shadow.id, '00000000-0000-0000-0000-000000000000')

    expect(result).toBeInstanceOf(MemberNotFound)
  })

  it('should not modify real member when merge fails', async () => {
    const real = await makeMember()
    const realBefore = await findById(real.id)

    await mergeMembers('00000000-0000-0000-0000-000000000000', real.id)

    const realAfter = await findById(real.id)
    expect(realAfter).toEqual(realBefore)
  })
})
