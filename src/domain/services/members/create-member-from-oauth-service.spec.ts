import { describe, expect, it } from 'vitest'
import { CannotCreateDuplicatedMember } from '@/domain/errors/cannot-create-duplicated-member'
import { DomainError } from '@/domain/errors/domain-error'
import { findMembership } from '@/infra/db/repositories/membership-repository'
import { findByOwnerId } from '@/infra/db/repositories/workspaces-repository'
import { makeMember, makeRawMember } from '@/tests/factories/make-member'
import { createMemberFromOAuth } from './create-member-from-oauth-service'

describe('createMemberFromOAuth', () => {
  it('should create a member with the given data', async () => {
    const raw = makeRawMember()

    const result = await createMemberFromOAuth({
      userId: 'user-id-123',
      name: raw.name ?? '',
      email: raw.email ?? '',
      username: raw.username ?? '',
    })

    expect(result).toEqual({
      id: expect.any(String),
      userId: 'user-id-123',
      name: raw.name,
      username: raw.username,
      email: raw.email,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      active: true,
    })
  })

  it('should create a Personal workspace owned by the new member', async () => {
    const raw = makeRawMember()

    const result = await createMemberFromOAuth({
      userId: 'user-id-456',
      name: raw.name ?? '',
      email: raw.email ?? '',
      username: raw.username ?? '',
    })

    expect(result).not.toBeInstanceOf(DomainError)

    const member = result as Awaited<
      ReturnType<typeof createMemberFromOAuth>
    > & { id: string }

    const workspace = await findByOwnerId(member.id)

    expect(workspace).toEqual(
      expect.objectContaining({
        name: 'Personal',
        ownerId: member.id,
        isPublic: false,
        active: true,
      })
    )
  })

  it('should add the member as a member of the Personal workspace', async () => {
    const raw = makeRawMember()

    const result = await createMemberFromOAuth({
      userId: 'user-id-789',
      name: raw.name ?? '',
      email: raw.email ?? '',
      username: raw.username ?? '',
    })

    expect(result).not.toBeInstanceOf(DomainError)

    const member = result as { id: string }
    const workspace = await findByOwnerId(member.id)

    expect(workspace).not.toBeNull()

    const membership = await findMembership(
      (workspace as NonNullable<typeof workspace>).id,
      member.id
    )

    expect(membership).toEqual(
      expect.objectContaining({
        memberId: member.id,
        workspaceId: (workspace as NonNullable<typeof workspace>).id,
      })
    )
  })

  it('should return the created member', async () => {
    const raw = makeRawMember()

    const result = await createMemberFromOAuth({
      userId: 'user-id-abc',
      name: raw.name ?? '',
      email: raw.email ?? '',
      username: raw.username ?? '',
    })

    expect(result).not.toBeInstanceOf(DomainError)
    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('email', raw.email)
  })

  it('should return DomainError and not create a workspace when member creation fails', async () => {
    const existing = await makeMember()

    const result = await createMemberFromOAuth({
      userId: 'user-id-dup',
      name: 'Duplicate User',
      email: existing.email ?? '',
      username: 'unique-username-for-dup-test',
    })

    expect(result).toBeInstanceOf(CannotCreateDuplicatedMember)

    const workspace = await findByOwnerId(existing.id)
    expect(workspace).toBeNull()
  })
})
