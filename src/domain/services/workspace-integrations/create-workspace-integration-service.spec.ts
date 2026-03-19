import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { IntegrationAlreadyExists } from '@/domain/errors/integration-already-exists'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { makeWorkspaceIntegration } from '@/tests/factories/make-workspace-integration'
import { createWorkspaceIntegration } from './create-workspace-integration-service'

describe('createWorkspaceIntegration', () => {
  it('should create an integration for an existing workspace', async () => {
    const workspace = await makeWorkspace()

    const result = await createWorkspaceIntegration({
      workspaceId: workspace.id,
      provider: 'discord',
      providerId: `guild-${Date.now()}`,
    })

    expect(result).not.toBeInstanceOf(WorkspaceNotFound)
    if (!('message' in result)) {
      expect(result.workspaceId).toBe(workspace.id)
      expect(result.provider).toBe('discord')
    }
  })

  it('should return WorkspaceNotFound when workspace does not exist', async () => {
    const result = await createWorkspaceIntegration({
      workspaceId: randomUUID(),
      provider: 'discord',
      providerId: 'guild-123',
    })

    expect(result).toBeInstanceOf(WorkspaceNotFound)
  })

  it('should return IntegrationAlreadyExists on duplicate provider+providerId', async () => {
    const workspace = await makeWorkspace()
    const existing = await makeWorkspaceIntegration({ workspaceId: workspace.id })

    const result = await createWorkspaceIntegration({
      workspaceId: workspace.id,
      provider: existing.provider,
      providerId: existing.providerId,
    })

    expect(result).toBeInstanceOf(IntegrationAlreadyExists)
  })
})
