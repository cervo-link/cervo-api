import { describe, expect, it } from 'vitest'
import { CannotCreateDuplicatedMember } from '@/domain/errors/cannot-create-duplicated-member'
import { makeMember, makeRawMember } from '@/tests/factories/make-member'
import { createMember } from './create-member-service'

describe('CreateMemberService', () => {
  it('should be able to create member', async () => {
    const member = makeRawMember()

    const result = await createMember(member)

    expect(result).toEqual({
      id: expect.any(String),
      userId: null,
      name: member.name,
      username: member.username,
      email: member.email,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      active: true,
    })
  })

  it('should be able to return error when username already exists', async () => {
    const member = await makeMember()

    const result = await createMember(makeRawMember({ username: member.username }))

    expect(result).toBeInstanceOf(CannotCreateDuplicatedMember)
  })

  it('should be able to return error when email already exists', async () => {
    const member = await makeMember()

    const result = await createMember(makeRawMember({ email: member.email }))

    expect(result).toBeInstanceOf(CannotCreateDuplicatedMember)
  })
})
