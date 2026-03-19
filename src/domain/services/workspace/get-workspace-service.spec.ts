import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { getWorkspace } from './get-workspace-service'

describe('getWorkspace', () => {
  it('should get a workspace by id', async () => {
    const workspace = await makeWorkspace()

    const result = await getWorkspace(workspace.id)

    expect(result).toBeDefined()
    expect(result).toHaveProperty('id', workspace.id)
  })

  it('should return WorkspaceNotFound when workspace does not exist', async () => {
    const result = await getWorkspace(randomUUID())

    expect(result).toBeInstanceOf(WorkspaceNotFound)
  })
})
