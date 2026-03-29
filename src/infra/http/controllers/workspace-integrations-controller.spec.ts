import type { FastifyReply, FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import type { Member } from '@/domain/entities/member'
import app from '@/infra/http/app'
import { makeMember } from '@/tests/factories/make-member'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { makeWorkspaceIntegration } from '@/tests/factories/make-workspace-integration'

const API_KEY = 'test-api-key-for-testing'

let currentMember: Member | null = null

vi.mock('@/infra/http/middlewares/session-auth', () => ({
  sessionAuth: vi.fn(async (request: FastifyRequest, reply: FastifyReply) => {
    if (!currentMember) {
      return reply.code(401).send({ message: 'Valid session is required.' })
    }
    request.member = currentMember
  }),
}))

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
    currentMember = null
    const workspace = await makeWorkspace()

    const response = await app.inject({
      method: 'POST',
      url: `/workspaces/${workspace.id}/integrations`,
      payload: { provider: 'discord', providerId: 'guild-123' },
    })

    expect(response.statusCode).toBe(401)
  })

  it('should add an integration via session when requester is the workspace owner', async () => {
    const owner = await makeMember()
    const workspace = await makeWorkspace({ ownerId: owner.id })
    currentMember = owner

    const response = await app.inject({
      method: 'POST',
      url: `/workspaces/${workspace.id}/integrations`,
      payload: { provider: 'discord', providerId: `guild-${Date.now()}` },
    })

    expect(response.statusCode).toBe(201)
    const body = JSON.parse(response.body)
    expect(body.integration.workspaceId).toBe(workspace.id)
    expect(body.integration.provider).toBe('discord')
  })

  it('should return 403 via session when requester is not the workspace owner', async () => {
    const owner = await makeMember()
    const other = await makeMember()
    const workspace = await makeWorkspace({ ownerId: owner.id })
    currentMember = other

    const response = await app.inject({
      method: 'POST',
      url: `/workspaces/${workspace.id}/integrations`,
      payload: { provider: 'discord', providerId: `guild-${Date.now()}` },
    })

    expect(response.statusCode).toBe(403)
    expect(JSON.parse(response.body)).toEqual({ message: 'Forbidden' })
  })

  it('should return 404 via session when workspace does not exist', async () => {
    currentMember = await makeMember()

    const response = await app.inject({
      method: 'POST',
      url: '/workspaces/00000000-0000-0000-0000-000000000000/integrations',
      payload: { provider: 'discord', providerId: 'guild-123' },
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({ message: 'Workspace not found' })
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
