import { faker } from '@faker-js/faker'

import type { InsertWorkspace } from '@/domain/entities/workspace'
import { DomainError } from '@/domain/errors/domain-error'
import { insertWorkspace } from '@/infra/db/repositories/workspaces-repository'
import { makeMember } from './make-member'

type Overrides = Partial<InsertWorkspace> & { ownerId?: string }

export function makeRawWorkspace(overrides: Overrides = {}): InsertWorkspace {
  return {
    name: faker.company.name(),
    active: true,
    isPublic: false,
    description: faker.lorem.sentence(),
    ownerId: overrides.ownerId ?? '',
    ...overrides,
  }
}

export async function makeWorkspace(overrides: Overrides = {}) {
  const ownerId = overrides.ownerId ?? (await makeMember()).id
  const workspace = await insertWorkspace(makeRawWorkspace({ ...overrides, ownerId }))
  if (workspace instanceof DomainError) {
    throw workspace
  }

  return workspace
}
