import { faker } from '@faker-js/faker'
import type { InsertWaitingListEntry } from '@/domain/entities/waiting-list'
import { insertWaitingListEntry } from '@/infra/db/repositories/waiting-list-repository'
import { unwrapOrThrow } from './unwrap'

type Overrides = Partial<InsertWaitingListEntry>

export function makeRawWaitingListEntry(overrides: Overrides = {}): InsertWaitingListEntry {
  return {
    email: faker.internet.email(),
    allowPromoEmails: false,
    ...overrides,
  }
}

export async function makeWaitingListEntry(overrides: Overrides = {}) {
  return unwrapOrThrow(await insertWaitingListEntry(makeRawWaitingListEntry(overrides)))
}
