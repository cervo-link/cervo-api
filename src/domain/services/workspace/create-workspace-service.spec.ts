import { describe, expect, it } from 'vitest'
import { DomainError } from '@/domain/errors/domain-error'
import { makeMember } from '@/tests/factories/make-member'
import {
  makeRawWorkspace,
  makeWorkspace,
} from '@/tests/factories/make-workspace'
import { createWorkspace } from './create-workspace-service'

describe('createWorkspace', () => {
  it('should create a workspace', async () => {
    const owner = await makeMember()
    const workspace = makeRawWorkspace({ ownerId: owner.id })

    const result = await createWorkspace(workspace)

    expect(result).toBeDefined()
  })

  it('should create two workspaces for different owners', async () => {
    const owner1 = await makeMember()
    const owner2 = await makeMember()

    await makeWorkspace({ ownerId: owner1.id })
    const result = await createWorkspace(
      makeRawWorkspace({ ownerId: owner2.id })
    )

    expect(result).toBeDefined()
  })

  it('should return DomainError when ownerId is null', async () => {
    const owner = await makeMember()
    const raw = makeRawWorkspace({ ownerId: owner.id })

    const result = await createWorkspace({ ...raw, ownerId: null })

    expect(result).toBeInstanceOf(DomainError)
    expect((result as DomainError).status).toBe(400)
  })
})
