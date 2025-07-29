import { describe, expect, it } from 'vitest'
import { MembershipNotFound } from '@/domain/errors/membership-not-found'
import { makeMember } from '@/tests/factories/make-member'
import { makeMembership } from '@/tests/factories/make-membership'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { getMembership } from './get-membership'

describe('GetMembership', () => {
  it('should get a membership', async () => {
    const workspace = await makeWorkspace()
    const member = await makeMember()
    const membership = await makeMembership(workspace.id, member.id)

    const result = await getMembership(workspace.id, member.id)

    expect(result).toEqual(membership)
  })

  it('should return a membership not found error', async () => {
    const workspace = await makeWorkspace()
    const member = await makeMember()

    const result = await getMembership(workspace.id, member.id)

    expect(result).toBeInstanceOf(MembershipNotFound)
  })
})
