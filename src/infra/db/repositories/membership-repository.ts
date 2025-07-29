import { and, eq } from 'drizzle-orm'
import type { InsertMembership, Membership } from '@/domain/entities/membership'
import type { DomainError } from '@/domain/errors/domain-error'
import { db } from '@/infra/db'
import { memberships } from '@/infra/db/schema'
import type { Transaction } from '@/infra/db/utils/transactions'

export async function insertMembershipWithTransaction(
  tx: Transaction,
  membership: InsertMembership
): Promise<Membership | DomainError> {
  const [result] = await tx.insert(memberships).values(membership).returning()
  return result
}

export async function insertMembership(
  membership: InsertMembership
): Promise<Membership | DomainError> {
  const [result] = await db.insert(memberships).values(membership).returning()
  return result
}

export async function findMembership(
  workspaceId: string,
  memberId: string
): Promise<Membership | null> {
  const [result] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.workspaceId, workspaceId),
        eq(memberships.memberId, memberId)
      )
    )
  return result
}
