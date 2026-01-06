import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import { WorkspaceNotFound } from '@/domain/errors/workspace-not-found'
import { makeWorkspace } from '@/tests/factories/make-workspace'
import { getWorkspace } from './get-workspace-service'

describe('getWorkspace', () => {
  it('should get a workspace by platformId and platform', async () => {
    const workspace = await makeWorkspace({
      platform: 'discord',
      platformId: faker.string.uuid(),
    })

    const result = await getWorkspace(workspace.platformId, 'discord')

    expect(result).toBeDefined()
    expect(result).toHaveProperty('id', workspace.id)
    expect(result).toHaveProperty('platformId', workspace.platformId)
    expect(result).toHaveProperty('platform', workspace.platform)
  })

  it('should return WorkspaceNotFound when workspace does not exist', async () => {
    const nonExistentPlatformId = faker.string.uuid()

    const result = await getWorkspace(nonExistentPlatformId, 'discord')

    expect(result).toBeInstanceOf(WorkspaceNotFound)
  })

  it('should return WorkspaceNotFound when platformId exists but platform is different', async () => {
    const workspace = await makeWorkspace({
      platform: 'discord',
      platformId: faker.string.uuid(),
    })

    const result = await getWorkspace(workspace.platformId, 'slack')

    expect(result).toBeInstanceOf(WorkspaceNotFound)
  })
})
