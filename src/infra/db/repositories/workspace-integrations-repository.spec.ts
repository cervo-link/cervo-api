import { describe, expect, it } from 'vitest'
import { IntegrationAlreadyExists } from '@/domain/errors/integration-already-exists'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { makeWorkspaceIntegration } from '@/tests/factories/make-workspace-integration'
import {
  findWorkspaceByIntegration,
  insertWorkspaceIntegration,
  updateIntegrationProviderName,
} from './workspace-integrations-repository'

describe('workspace-integrations-repository', () => {
  describe('insertWorkspaceIntegration', () => {
    it('should insert and return a workspace integration', async () => {
      const workspace = await makeWorkspace()

      const result = await insertWorkspaceIntegration({
        workspaceId: workspace.id,
        provider: 'discord',
        providerId: `guild-${Date.now()}`,
      })

      expect(result).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          workspaceId: workspace.id,
          provider: 'discord',
        })
      )
    })

    it('should return IntegrationAlreadyExists on duplicate provider+providerId', async () => {
      const workspace = await makeWorkspace()
      const existing = await makeWorkspaceIntegration({ workspaceId: workspace.id })

      const result = await insertWorkspaceIntegration({
        workspaceId: workspace.id,
        provider: existing.provider,
        providerId: existing.providerId,
      })

      expect(result).toBeInstanceOf(IntegrationAlreadyExists)
    })
  })

  describe('updateIntegrationProviderName', () => {
    it('should update and return the integration with the new name', async () => {
      const workspace = await makeWorkspace()
      const integration = await makeWorkspaceIntegration({ workspaceId: workspace.id })

      const result = await updateIntegrationProviderName(
        integration.provider,
        integration.providerId,
        'My Server'
      )

      expect(result).toEqual(
        expect.objectContaining({ id: integration.id, providerName: 'My Server' })
      )
    })

    it('should return null when integration does not exist', async () => {
      const result = await updateIntegrationProviderName('discord', 'nonexistent', 'Name')
      expect(result).toBeNull()
    })
  })

  describe('findWorkspaceByIntegration', () => {
    it('should return the workspace when integration exists', async () => {
      const workspace = await makeWorkspace()
      const integration = await makeWorkspaceIntegration({ workspaceId: workspace.id })

      const result = await findWorkspaceByIntegration(
        integration.provider,
        integration.providerId
      )

      expect(result).toEqual(
        expect.objectContaining({ id: workspace.id })
      )
    })

    it('should return null when integration does not exist', async () => {
      const result = await findWorkspaceByIntegration('discord', 'nonexistent-guild')

      expect(result).toBeNull()
    })
  })
})
