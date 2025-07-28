import { describe, expect, it } from 'vitest'
import { createWorkspace } from './create-workspace-service'
import {
  makeRawWorkspace,
  makeWorkspace,
} from '@/tests/factories/make-workspace'
import { faker } from '@faker-js/faker'
import { CannotCreateWorkspaceDueConstraintError } from '@/domain/errors/cannot-create-workspace-due-constraint'

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

    const result = await createWorkspace(workspaceWithSamePlatformId)

    expect(result).toBeInstanceOf(CannotCreateWorkspaceDueConstraintError)
    expect((result as CannotCreateWorkspaceDueConstraintError).message).toBe(
      `Key (platform_id, platform)=(${platformId}, ${workspace.platform}) already exists.`
    )
  })

  it('should insert when id exists but platform is different', async () => {
    const platformId = faker.string.uuid()

    await makeWorkspace({
      platform: 'discord',
      platformId,
    })

    const workspaceWithDifferentPlatform = makeRawWorkspace({
      platform: 'slack',
      platformId,
    })

    const result = await createWorkspace(workspaceWithDifferentPlatform)

    expect(result).toBeDefined()
  })
})
