import { trace } from '@opentelemetry/api'
import { and, eq } from 'drizzle-orm'
import type { InsertMembership, Membership } from '@/domain/entities/membership'
import { CannotCreateMembershipAlreadyExists } from '@/domain/errors/cannot-create-membership-already-exists'
import { DomainError } from '@/domain/errors/domain-error'
import { db } from '@/infra/db'
import { memberships } from '@/infra/db/schema'
import { getPgError } from '../utils/get-pg-error'
import { PgIntegrityConstraintViolation } from '../utils/postgres-error-codes'

export async function insertMembership(
  membership: InsertMembership
): Promise<Membership | DomainError> {
  const tracer = trace.getTracer('insert-membership')

  return tracer.startActiveSpan('insert-membership-repository', async span => {
    try {
      const [result] = await db
        .insert(memberships)
        .values(membership)
        .returning()
      span.end()
      return result
    } catch (error) {
      span.end()
      return handleError(error)
    }
  })
}

export async function findMembership(
  workspaceId: string,
  memberId: string
): Promise<Membership | null> {
  const tracer = trace.getTracer('find-membership')

  return tracer.startActiveSpan('find-membership-repository', async span => {
    const [result] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.workspaceId, workspaceId),
          eq(memberships.memberId, memberId)
        )
      )
    span.end()
    return result
  })
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
