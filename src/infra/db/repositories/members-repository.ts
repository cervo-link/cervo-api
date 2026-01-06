import { trace } from '@opentelemetry/api'
import { eq } from 'drizzle-orm'
import type { InsertMember, Member } from '@/domain/entities/member'
import { CannotCreateDuplicatedMember } from '@/domain/errors/cannot-create-duplicated-member'
import { DomainError } from '@/domain/errors/domain-error'
import { db } from '@/infra/db/'
import { members } from '@/infra/db/schema'
import { getPgError } from '@/infra/db/utils/get-pg-error'
import { PgIntegrityConstraintViolation } from '@/infra/db/utils/postgres-error-codes'
import type { Transaction } from '@/infra/db/utils/transactions'

export async function insertMember(
  member: InsertMember
): Promise<Member | DomainError> {
  const tracer = trace.getTracer('insert-member')

  return tracer.startActiveSpan('insert-member-repository', async span => {
    try {
      const [result] = await db.insert(members).values(member).returning()
      span.end()
      return result
    } catch (error) {
      span.end()
      return handleError(error)
    }
  })
}

export async function insertMemberWithTransaction(
  tx: Transaction,
  member: InsertMember
): Promise<Member | DomainError> {
  const tracer = trace.getTracer('insert-member-with-transaction')

  return tracer.startActiveSpan(
    'insert-member-with-transaction-repository',
    async span => {
      try {
        const [result] = await tx.insert(members).values(member).returning()
        span.end()
        return result
      } catch (error) {
        span.end()
        return handleError(error)
      }
    }
  )
}

export async function findById(id: string): Promise<Member | null> {
  const tracer = trace.getTracer('find-member')

  return tracer.startActiveSpan('find-member-repository', async span => {
    const [result] = await db.select().from(members).where(eq(members.id, id))
    span.end()
    return result || null
  })
}

export async function findByDiscordUserId(
  discordUserId: string
): Promise<Member | null> {
  const tracer = trace.getTracer('find-member-by-discord-user-id')

  return tracer.startActiveSpan(
    'find-member-by-discord-user-id-repository',
    async span => {
      const [result] = await db
        .select()
        .from(members)
        .where(eq(members.discordUserId, discordUserId))
      span.end()
      return result
    }
  )
}

function handleError(error: unknown): DomainError {
  const pgError = getPgError(error)
  if (pgError) {
    if (pgError.code === PgIntegrityConstraintViolation.UniqueViolation) {
      return new CannotCreateDuplicatedMember()
    }
  }
  return new DomainError(
    `Failed to insert member due error: ${error as string}`,
    500
  )
}
