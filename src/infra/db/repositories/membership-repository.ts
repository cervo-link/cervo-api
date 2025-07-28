import type { InsertMembership, Membership } from '@/domain/entities/membership'
import type { DomainError } from '@/domain/errors/domain-error'
import { memberships } from '@/infra/db/schema'
import type { Transaction } from '@/infra/db/utils/transactions'

export async function insertMembershipWithTransaction(
  tx: Transaction,
  membership: InsertMembership
): Promise<Membership | DomainError> {
  const [result] = await tx.insert(memberships).values(membership).returning()
  return result
}
