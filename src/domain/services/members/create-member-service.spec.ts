import { describe, expect, it } from 'vitest'

import { makeMember, makeRawMember } from '@/tests/factories/make-member'
import { createMember } from './create-member-service'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { faker } from '@faker-js/faker'

describe('CreateMemberService', () => {
  it('should create a member', async () => {
    const workspace = await makeWorkspace()
    const member = makeRawMember()

    const result = await createMember(member, workspace.id)

    expect(result).toEqual(
      expect.objectContaining({
        ...member,
        id: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        passwordHash: null,
      })
    )
  })

  it('should throw an error if the member already exists', async () => {
    const workspace = await makeWorkspace()
    const member = await makeMember()

    await expect(createMember(member, workspace.id)).rejects.toThrow(
      'duplicate key value violates unique constraint "members_pkey"'
    )
  })

  it('should throw an error if the workspace does not exist', async () => {
    const member = makeRawMember()

    const invalidWorkspaceId = faker.string.uuid()

    await expect(createMember(member, invalidWorkspaceId)).rejects.toThrow(
      'Workspace not found'
    )
  })
})
