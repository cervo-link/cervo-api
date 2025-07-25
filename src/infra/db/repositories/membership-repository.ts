import type { InsertMembership, Membership } from '@/domain/entities/membership'
import { memberships } from '@/infra/db/schema'
import type { Transaction } from '../utils/transactions'

export async function insertMembershipWithTransaction(
  tx: Transaction,
  membership: InsertMembership
): Promise<Membership> {
  const [result] = await tx.insert(memberships).values(membership).returning()
  return result
}
