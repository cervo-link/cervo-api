import { describe, expect, it } from 'vitest'
import app from '@/infra/http/app'
import { makeMember } from '@/tests/factories/make-member'
import { makeWorkspace } from '@/tests/factories/make-workspace'

const API_KEY = 'test-api-key-for-testing'

describe('WorkspaceController', () => {
  describe('POST /workspaces/create', () => {
    it('should be able to create a workspace', async () => {
      const owner = await makeMember()

      const payload = {
        name: 'My Workspace',
        description: 'A test workspace',
        ownerId: owner.id,
      }

      const response = await app.inject({
        method: 'POST',
        url: '/workspaces/create',
        headers: { authorization: `Bearer ${API_KEY}` },
        payload,
      })

      expect(response.statusCode).toBe(201)
      expect(JSON.parse(response.body)).toEqual({
        workspace: {
          id: expect.any(String),
          ownerId: owner.id,
          name: payload.name,
          description: payload.description,
          isPublic: false,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          active: true,
        },
      })
    })
  })

  describe('GET /workspaces', () => {
    it('should be able to get a workspace by id', async () => {
      const workspace = await makeWorkspace()

      const response = await app.inject({
        method: 'GET',
        url: `/workspaces?id=${workspace.id}`,
        headers: { authorization: `Bearer ${API_KEY}` },
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual({
        workspace: {
          id: workspace.id,
          ownerId: workspace.ownerId,
          name: workspace.name,
          description: workspace.description,
          isPublic: workspace.isPublic,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          active: true,
        },
      })
    })

    it('should return 404 when workspace is not found', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/workspaces?id=00000000-0000-0000-0000-000000000000',
        headers: { authorization: `Bearer ${API_KEY}` },
      })

      expect(response.statusCode).toBe(404)
      expect(JSON.parse(response.body)).toEqual({ message: 'Workspace not found' })
    })
  })
})
