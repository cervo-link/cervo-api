import { describe, expect, it } from 'vitest'
import app from '@/infra/http/app'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { makeWorkspaceIntegration } from '@/tests/factories/make-workspace-integration'

const API_KEY = 'test-api-key-for-testing'

describe('POST /workspaces/:workspaceId/integrations', () => {
  it('should add an integration to a workspace', async () => {
    const workspace = await makeWorkspace()

    const response = await app.inject({
      method: 'POST',
      url: `/workspaces/${workspace.id}/integrations`,
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: { provider: 'discord', providerId: `guild-${Date.now()}` },
    })

    expect(response.statusCode).toBe(201)
    const body = JSON.parse(response.body)
    expect(body.integration.workspaceId).toBe(workspace.id)
    expect(body.integration.provider).toBe('discord')
  })

  it('should return 404 when workspace does not exist', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/workspaces/00000000-0000-0000-0000-000000000000/integrations',
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: { provider: 'discord', providerId: 'guild-123' },
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({ message: 'Workspace not found' })
  })

  it('should return 422 when integration already exists', async () => {
    const workspace = await makeWorkspace()
    const integration = await makeWorkspaceIntegration({ workspaceId: workspace.id })

    const response = await app.inject({
      method: 'POST',
      url: `/workspaces/${workspace.id}/integrations`,
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: { provider: integration.provider, providerId: integration.providerId },
    })

    expect(response.statusCode).toBe(422)
    expect(JSON.parse(response.body)).toEqual({ message: 'Integration already exists' })
  })

  it('should return 401 when API key is missing', async () => {
    const workspace = await makeWorkspace()

    const response = await app.inject({
      method: 'POST',
      url: `/workspaces/${workspace.id}/integrations`,
      payload: { provider: 'discord', providerId: 'guild-123' },
    })

    expect(response.statusCode).toBe(401)
  })
})

describe('GET /workspaces/by-integration', () => {
  it('should return a workspace for a known integration', async () => {
    const workspace = await makeWorkspace()
    const integration = await makeWorkspaceIntegration({ workspaceId: workspace.id })

    const response = await app.inject({
      method: 'GET',
      url: '/workspaces/by-integration',
      headers: { authorization: `Bearer ${API_KEY}` },
      query: { provider: integration.provider, providerId: integration.providerId },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).workspace.id).toBe(workspace.id)
  })

  it('should return 404 for an unknown integration', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/workspaces/by-integration',
      headers: { authorization: `Bearer ${API_KEY}` },
      query: { provider: 'discord', providerId: 'nonexistent-guild' },
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({ message: 'Workspace not found' })
  })
})
