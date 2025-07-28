import type { Member, InsertMember } from '@/domain/entities/member'

export function toBeCreatedMember(received: Member, expected: InsertMember) {
  const pass =
    received.name === expected.name &&
    received.email === expected.email &&
    received.username === expected.username &&
    received.discordUserId === expected.discordUserId &&
    received.active === expected.active &&
    typeof received.id === 'string' &&
    received.id.length > 0 &&
    received.createdAt instanceof Date &&
    received.updatedAt instanceof Date &&
    received.passwordHash === null

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${received} not to be a created member`
        : `Expected ${received} to be a created member with data ${JSON.stringify(expected)}`,
  }
}

// Extend expect types
declare global {
  namespace Vi {
    interface JestAssertion<T> {
      toBeCreatedMember(expected: InsertMember): T
    }
  }
}
