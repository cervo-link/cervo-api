import { faker } from '@faker-js/faker'

import type { InsertMember } from '@/domain/entities/member'
import { DomainError } from '@/domain/errors/domain-error'
import { insertMember } from '@/infra/db/repositories/members-repository'

type Overrides = Partial<InsertMember>

export function makeRawMember(overrides: Overrides = {}): InsertMember {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    active: true,
    discordUserId: faker.string.uuid(),
    username: faker.internet.username(),
    ...overrides,
  }
}

export async function makeMember(overrides: Overrides = {}) {
  const member = await insertMember(makeRawMember(overrides))
  if (member instanceof DomainError) {
    throw member
  }

  return member
}
