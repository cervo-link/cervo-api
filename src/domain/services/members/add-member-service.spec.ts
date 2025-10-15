import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import { CannotCreateMembershipAlreadyExists } from '@/domain/errors/cannot-create-membership-already-exists'
import { MemberNotFound } from '@/domain/errors/member-not-found'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { makeMember } from '@/tests/factories/make-member'
import { makeMembership } from '@/tests/factories/make-membership'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { addMemberToWorkspace } from './add-member-service'

describe('AddMemberToWorkspaceService', () => {
  it('should add a member to a workspace', async () => {
    const workspace = await makeWorkspace()
    const member = await makeMember()

    const result = await addMemberToWorkspace(member.id, workspace.id)

    expect(result).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        memberId: member.id,
        workspaceId: workspace.id,
      })
    )
  })

  it('should throw an error if the workspace does not exist', async () => {
    const member = await makeMember()

    const invalidWorkspaceId = faker.string.uuid()

    const result = await addMemberToWorkspace(member.id, invalidWorkspaceId)

    expect(result).toBeInstanceOf(WorkspaceNotFound)
  })

  it('should throw an error if the member already exists in the workspace', async () => {
    const workspace = await makeWorkspace()
    const member = await makeMember()
    await makeMembership(workspace.id, member.id)

    const result = await addMemberToWorkspace(member.id, workspace.id)

    expect(result).toBeInstanceOf(CannotCreateMembershipAlreadyExists)
  })

  it('should throw an error if the member not exist', async () => {
    const fakeId = faker.string.uuid()
    const workspace = await makeWorkspace()
    await makeMembership(workspace.id, fakeId)

    const result = await addMemberToWorkspace(fakeId, workspace.id)

    expect(result).toBeInstanceOf(MemberNotFound)
  })
})
