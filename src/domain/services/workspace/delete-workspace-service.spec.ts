import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { DomainError } from '@/domain/errors/domain-error'
import { findById } from '@/infra/db/repositories/workspaces-repository'
import { makeMember } from '@/tests/factories/make-member'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { deleteWorkspace } from './delete-workspace-service'

describe('deleteWorkspace', () => {
  it('should delete a workspace', async () => {
    const owner = await makeMember()
    const workspace = await makeWorkspace({ ownerId: owner.id })

    const result = await deleteWorkspace(workspace.id)

    expect(result).toBeNull()
    expect(await findById(workspace.id)).toBeUndefined()
  })

  it('should return 404 when workspace does not exist', async () => {
    const result = await deleteWorkspace(randomUUID())

    expect(result).toBeInstanceOf(DomainError)
    expect((result as DomainError).status).toBe(404)
  })

  it('should return 403 when workspace is personal', async () => {
    const owner = await makeMember()
    const workspace = await makeWorkspace({ ownerId: owner.id, isPersonal: true })

    const result = await deleteWorkspace(workspace.id)

    expect(result).toBeInstanceOf(DomainError)
    expect((result as DomainError).status).toBe(403)
  })
})
