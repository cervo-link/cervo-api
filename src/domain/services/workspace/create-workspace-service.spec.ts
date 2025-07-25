import { describe, expect, it } from 'vitest'
import { createWorkspace } from './create-workspace-service'
import {
  makeRawWorkspace,
  makeWorkspace,
} from '@/tests/factories/make-workspace'
import { faker } from '@faker-js/faker'

describe('createWorkspace', () => {
  it('should create a workspace', async () => {
    const workspace = makeRawWorkspace()

    const createdWorkspace = await createWorkspace(workspace)

    expect(createdWorkspace).toBeDefined()
  })

  it('should return an error when trying to create a workspace with an existing platformId', async () => {
    const platformId = faker.string.uuid()

    const workspace = await makeWorkspace({
      platform: 'discord',
      platformId,
    })

    expect(workspace).toBeDefined()

    const workspaceWithSamePlatformId = makeRawWorkspace({
      platformId,
    })

    await expect(createWorkspace(workspaceWithSamePlatformId)).rejects.toThrow(
      `Workspace with platformId ${platformId} already exists`
    )
  })
})
