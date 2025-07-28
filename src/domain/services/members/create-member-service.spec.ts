import { describe, expect, it } from 'vitest'

import { makeRawMember } from '@/tests/factories/make-member'
import { createMember } from './create-member-service'
import { makeWorkspace } from '@/tests/factories/make-workspace'

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
})
