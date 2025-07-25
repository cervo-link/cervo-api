import { faker } from '@faker-js/faker'

import type { InsertWorkspace, Workspace } from '@/domain/entities/workspace'
import { insertWorkspace } from '@/infra/db/repositories/workspaces-repository'

type Overrides = Partial<InsertWorkspace>

export function makeRawWorkspace(overrides: Overrides = {}): InsertWorkspace {
  return {
    name: faker.company.name(),
    platform: 'discord',
    active: true,
    platformId: faker.string.uuid(),
    description: faker.lorem.sentence(),
    ...overrides,
  }
}

export async function makeWorkspace(
  overrides: Overrides = {}
): Promise<Workspace> {
  const workspace = await insertWorkspace(makeRawWorkspace(overrides))

  return workspace
}

export async function makeWorkspaceReturningId(
  overrides: Overrides = {}
): Promise<string> {
  const { id } = await makeWorkspace(overrides)

  return id
}
