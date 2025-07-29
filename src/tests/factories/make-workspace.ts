import { faker } from '@faker-js/faker'

import type { InsertWorkspace } from '@/domain/entities/workspace'
import { DomainError } from '@/domain/errors/domain-error'
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

export async function makeWorkspace(overrides: Overrides = {}) {
  const workspace = await insertWorkspace(makeRawWorkspace(overrides))
  if (workspace instanceof DomainError) {
    throw workspace
  }

  return workspace
}
