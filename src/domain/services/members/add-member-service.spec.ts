import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { makeRawMember } from '@/tests/factories/make-member'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { addMemberToWorkspace } from './add-member-service'

describe('AddMemberToWorkspaceService', () => {
  it('should add a member to a workspace', async () => {
    const workspace = await makeWorkspace()
    const member = makeRawMember()

    const result = await addMemberToWorkspace(member, workspace.id)

    expect(result).toEqual(
      expect.objectContaining({
        ...member,
        id: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
    )
  })

  it('should throw an error if the workspace does not exist', async () => {
    const member = makeRawMember()

    const invalidWorkspaceId = faker.string.uuid()

    const result = await addMemberToWorkspace(member, invalidWorkspaceId)

    expect(result).toBeInstanceOf(WorkspaceNotFound)
  })
})
