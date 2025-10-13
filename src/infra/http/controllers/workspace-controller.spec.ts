import { describe, expect, it } from 'vitest'
import {
  makeRawWorkspace,
  makeWorkspace,
} from '@/tests/factories/make-workspace'

describe('WorkspaceController', () => {
  it('should be able to create a workspace', async () => {
    const workspace = makeRawWorkspace()

    const payload = {
      name: workspace.name,
      description: workspace.description,
      platform: workspace.platform,
      platformId: workspace.platformId,
    }

    const response = await global.__SERVER__.inject({
      method: 'POST',
      url: '/workspaces/create',
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

    const response = await global.__SERVER__.inject({
      method: 'POST',
      url: '/workspaces/create',
      payload,
    })

    expect(response.statusCode).toBe(422)
    expect(JSON.parse(response.body)).toEqual({
      message: 'Cannot create workspace due constraint',
    })
  })
})
