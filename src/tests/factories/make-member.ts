import { faker } from '@faker-js/faker'

import type { InsertMember } from '@/domain/entities/member'
import { insertMember } from '@/infra/db/repositories/members-repository'
import { unwrapOrThrow } from './unwrap'

type Overrides = Partial<InsertMember>

export function makeRawMember(overrides: Overrides = {}): InsertMember {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    active: true,
    username: faker.internet.username(),
    ...overrides,
  }
}

export async function makeMember(overrides: Overrides = {}) {
  return unwrapOrThrow(await insertMember(makeRawMember(overrides)))
}
