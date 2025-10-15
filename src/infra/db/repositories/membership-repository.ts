import { and, eq } from 'drizzle-orm'
import type { InsertMembership, Membership } from '@/domain/entities/membership'
import { CannotCreateMembershipAlreadyExists } from '@/domain/errors/cannot-create-membership-already-exists'
import { DomainError } from '@/domain/errors/domain-error'
import { db } from '@/infra/db'
import { memberships } from '@/infra/db/schema'
import type { Transaction } from '@/infra/db/utils/transactions'
import { getPgError } from '../utils/get-pg-error'
import { PgIntegrityConstraintViolation } from '../utils/postgres-error-codes'

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
  try {
    const [result] = await db.insert(memberships).values(membership).returning()
    return result
  } catch (error) {
    return handleError(error)
  }
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

function handleError(error: unknown): DomainError {
  const pgError = getPgError(error)
  if (pgError) {
    if (pgError.code === PgIntegrityConstraintViolation.UniqueViolation) {
      return new CannotCreateMembershipAlreadyExists()
    }
  }
  return new DomainError(
    `Failed to insert membership due error: ${error as string}`,
    500
  )
}
