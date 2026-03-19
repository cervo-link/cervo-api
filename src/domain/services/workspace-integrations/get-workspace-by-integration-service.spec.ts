import { describe, expect, it } from 'vitest'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { makeWorkspaceIntegration } from '@/tests/factories/make-workspace-integration'
import { getWorkspaceByIntegration } from './get-workspace-by-integration-service'

describe('getWorkspaceByIntegration', () => {
  it('should return a workspace for a known provider integration', async () => {
    const workspace = await makeWorkspace()
    const integration = await makeWorkspaceIntegration({ workspaceId: workspace.id })

    const result = await getWorkspaceByIntegration(
      integration.provider,
      integration.providerId
    )

    expect(result).not.toBeInstanceOf(WorkspaceNotFound)
    if (!('message' in result)) {
      expect(result.id).toBe(workspace.id)
    }
  })

  it('should return WorkspaceNotFound for unknown provider+providerId', async () => {
    const result = await getWorkspaceByIntegration('discord', 'unknown-guild')
    expect(result).toBeInstanceOf(WorkspaceNotFound)
  })
})
