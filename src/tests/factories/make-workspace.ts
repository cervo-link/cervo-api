import { faker } from '@faker-js/faker'

import type { InsertWorkspace } from '@/domain/entities/workspace'
import { insertWorkspace } from '@/infra/db/repositories/workspaces-repository'
import { makeMember } from './make-member'
import { unwrapOrThrow } from './unwrap'

type Overrides = Partial<InsertWorkspace> & { ownerId?: string }

export function makeRawWorkspace(overrides: Overrides = {}): InsertWorkspace {
  return {
    name: faker.company.name(),
    active: true,
    isPublic: false,
    isPersonal: false,
    description: faker.lorem.sentence(),
    ownerId: overrides.ownerId ?? '',
    ...overrides,
  }
}

export async function makeWorkspace(overrides: Overrides = {}) {
  const ownerId = overrides.ownerId ?? (await makeMember()).id
  return unwrapOrThrow(
    await insertWorkspace(makeRawWorkspace({ ...overrides, ownerId }))
  )
}
