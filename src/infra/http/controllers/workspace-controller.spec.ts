import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import app from '@/infra/http/app'
import {
  makeRawWorkspace,
  makeWorkspace,
} from '@/tests/factories/make-workspace'

const API_KEY = 'test-api-key-for-testing'

describe('WorkspaceController', () => {
  describe('POST /workspaces/create', () => {
    it('should be able to create a workspace', async () => {
      const workspace = makeRawWorkspace()

      const payload = {
        name: workspace.name,
        description: workspace.description,
        platform: workspace.platform,
        platformId: workspace.platformId,
      }

      const response = await app.inject({
        method: 'POST',
        url: '/workspaces/create',
        headers: {
          authorization: `Bearer ${API_KEY}`,
        },
        payload,
      })

      expect(response.statusCode).toBe(201)
      expect(JSON.parse(response.body)).toEqual({
        workspace: {
          id: expect.any(String),
          name: workspace.name,
          description: workspace.description,
          platform: workspace.platform,
          platformId: workspace.platformId,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          active: true,
        },
      })
    })

    it('should be able to return error platformId already exists', async () => {
      const workspace = makeRawWorkspace()

      await makeWorkspace({ platformId: workspace.platformId })

      const payload = {
        name: workspace.name,
        description: workspace.description,
        platform: workspace.platform,
        platformId: workspace.platformId,
      }

      const response = await app.inject({
        method: 'POST',
        url: '/workspaces/create',
        headers: {
          authorization: `Bearer ${API_KEY}`,
        },
        payload,
      })

      expect(response.statusCode).toBe(422)
      expect(JSON.parse(response.body)).toEqual({
        message: 'Cannot create workspace due constraint',
      })
    })
  })

  describe('GET /workspaces', () => {
    it('should be able to get a workspace by platformId and platform', async () => {
      const workspace = await makeWorkspace({
        platform: 'discord',
        platformId: faker.string.uuid(),
      })

      const response = await app.inject({
        method: 'GET',
        url: `/workspaces?platformId=${workspace.platformId}&platform=${workspace.platform}`,
        headers: {
          authorization: `Bearer ${API_KEY}`,
        },
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual({
        workspace: {
          id: workspace.id,
          name: workspace.name,
          description: workspace.description,
          platform: workspace.platform,
          platformId: workspace.platformId,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          active: true,
        },
      })
    })

    it('should return 204 when workspace is not found', async () => {
      const nonExistentPlatformId = faker.string.uuid()

      const response = await app.inject({
        method: 'GET',
        url: `/workspaces?platformId=${nonExistentPlatformId}&platform=discord`,
        headers: {
          authorization: `Bearer ${API_KEY}`,
        },
      })

      expect(response.statusCode).toBe(404)
      expect(JSON.parse(response.body)).toEqual({
        message: 'Workspace not found',
      })
    })

    it('should return 404 when platformId exists but platform is different', async () => {
      const workspace = await makeWorkspace({
        platform: 'discord',
        platformId: faker.string.uuid(),
      })

      const response = await app.inject({
        method: 'GET',
        url: `/workspaces?platformId=${workspace.platformId}&platform=slack`,
        headers: {
          authorization: `Bearer ${API_KEY}`,
        },
      })

      expect(response.statusCode).toBe(404)
      expect(JSON.parse(response.body)).toEqual({
        message: 'Workspace not found',
      })
    })
  })
})
