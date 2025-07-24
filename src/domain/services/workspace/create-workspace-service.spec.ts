import { describe, it, expect } from 'vitest'
import { createWorkspace } from './create-workspace-service'

describe('createWorkspace', () => {
  it('should create a workspace', async () => {
    const workspace = await createWorkspace({
      name: 'Test Workspace',
      platform: 'discord',
      active: true,
      platformId: '123',
    })

    expect(workspace).toBeDefined()
  })
})
