import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { DomainError } from '@/domain/errors/domain-error'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { makeMember } from '@/tests/factories/make-member'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { updateWorkspace } from './update-workspace-service'

describe('updateWorkspace', () => {
  it('should update workspace name', async () => {
    const owner = await makeMember()
    const workspace = await makeWorkspace({ ownerId: owner.id })

    const result = await updateWorkspace(workspace.id, owner.id, {
      name: 'Updated Name',
    })

    expect(result).not.toBeInstanceOf(DomainError)
    expect((result as { name: string }).name).toBe('Updated Name')
  })

  it('should update workspace description', async () => {
    const owner = await makeMember()
    const workspace = await makeWorkspace({ ownerId: owner.id })

    const result = await updateWorkspace(workspace.id, owner.id, {
      description: 'A new description',
    })

    expect(result).not.toBeInstanceOf(DomainError)
    expect((result as { description: string }).description).toBe(
      'A new description'
    )
  })

  it('should update workspace visibility', async () => {
    const owner = await makeMember()
    const workspace = await makeWorkspace({ ownerId: owner.id, isPublic: false })

    const result = await updateWorkspace(workspace.id, owner.id, {
      isPublic: true,
    })

    expect(result).not.toBeInstanceOf(DomainError)
    expect((result as { isPublic: boolean }).isPublic).toBe(true)
  })

  it('should return WorkspaceNotFound when workspace does not exist', async () => {
    const owner = await makeMember()

    const result = await updateWorkspace(randomUUID(), owner.id, {
      name: 'New Name',
    })

    expect(result).toBeInstanceOf(WorkspaceNotFound)
  })

  it('should return 403 when requester is not the owner', async () => {
    const owner = await makeMember()
    const other = await makeMember()
    const workspace = await makeWorkspace({ ownerId: owner.id })

    const result = await updateWorkspace(workspace.id, other.id, {
      name: 'Hijacked',
    })

    expect(result).toBeInstanceOf(DomainError)
    expect((result as DomainError).status).toBe(403)
  })

  it('should return 403 when workspace is personal', async () => {
    const owner = await makeMember()
    const workspace = await makeWorkspace({ ownerId: owner.id, isPersonal: true })

    const result = await updateWorkspace(workspace.id, owner.id, {
      name: 'New Name',
    })

    expect(result).toBeInstanceOf(DomainError)
    expect((result as DomainError).status).toBe(403)
  })
})
