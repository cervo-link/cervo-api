import { faker } from '@faker-js/faker'
import { randomBytes } from 'crypto'

import type { InsertWorkspace } from '@/domain/entities/workspace'
import { DomainError } from '@/domain/errors/domain-error'
import { insertWorkspace } from '@/infra/db/repositories/workspaces-repository'

type Overrides = Partial<InsertWorkspace>

export function makeRawWorkspace(overrides: Overrides = {}): InsertWorkspace {
  // Generate a truly unique platformId using crypto random bytes
  const randomId = randomBytes(16).toString('hex')
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 15)

  return {
    name: faker.company.name(),
    platform: 'discord',
    active: true,
    platformId: `${randomId}-${timestamp}-${randomSuffix}`,
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
