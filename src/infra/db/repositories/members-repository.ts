import { eq } from 'drizzle-orm'
import type { InsertMember, Member } from '@/domain/entities/member'
import { CannotCreateDuplicatedMember } from '@/domain/errors/cannot-create-duplicated-member'
import { DomainError } from '@/domain/errors/domain-error'
import { withSpan } from '@/infra/utils/with-span'
import { db } from '@/infra/db/'
import { members } from '@/infra/db/schema'
import { getPgError } from '@/infra/db/utils/get-pg-error'
import { PgIntegrityConstraintViolation } from '@/infra/db/utils/postgres-error-codes'
import type { Transaction } from '@/infra/db/utils/transactions'

export async function insertMember(
  member: InsertMember
): Promise<Member | DomainError> {
  return withSpan('insert-member', async () => {
    try {
      const [result] = await db.insert(members).values(member).returning()
      return result
    } catch (error) {
      return handleError(error)
    }
  })
}

export async function insertMemberWithTransaction(
  tx: Transaction,
  member: InsertMember
): Promise<Member | DomainError> {
  return withSpan('insert-member-with-transaction', async () => {
    try {
      const [result] = await tx.insert(members).values(member).returning()
      return result
    } catch (error) {
      return handleError(error)
    }
  })
}

export async function findById(id: string): Promise<Member | null> {
  return withSpan('find-member', async () => {
    const [result] = await db.select().from(members).where(eq(members.id, id))
    return result || null
  })
}

export async function findByUserId(userId: string): Promise<Member | null> {
  return withSpan('find-member-by-user-id', async () => {
    const [result] = await db
      .select()
      .from(members)
      .where(eq(members.userId, userId))
    return result || null
  })
}

export async function updateUserId(
  memberId: string,
  userId: string
): Promise<void> {
  await db.update(members).set({ userId }).where(eq(members.id, memberId))
}

export async function findByEmail(email: string): Promise<Member | null> {
  return withSpan('find-member-by-email', async () => {
    const [result] = await db
      .select()
      .from(members)
      .where(eq(members.email, email))
    return result || null
  })
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
