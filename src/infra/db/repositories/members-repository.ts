import type { InsertMember, Member } from '@/domain/entities/member'

import { members } from '@/infra/db/schema'
import { db } from '@/infra/db/'
import { eq } from 'drizzle-orm'
import type { Transaction } from '@/infra/db/utils/transactions'
import type { DomainError } from '@/domain/errors/domain-error'
import { CannotCreateDuplicatedMember } from '@/domain/errors/cannot-create-duplicated-member'
import { getPgError } from '@/infra/db/utils/get-pg-error'
import { PgIntegrityConstraintViolation } from '@/infra/db/utils/postgres-error-codes'

export async function insertMember(
  member: InsertMember
): Promise<Member | DomainError> {
  const [result] = await db.insert(members).values(member).returning()
  return result
}

export async function insertMemberWithTransaction(
  tx: Transaction,
  member: InsertMember
): Promise<Member | DomainError> {
  try {
    const [result] = await tx.insert(members).values(member).returning()
    return result
  } catch (error) {
    const pgError = getPgError(error)
    if (pgError) {
      if (pgError.code === PgIntegrityConstraintViolation.UniqueViolation) {
        return new CannotCreateDuplicatedMember()
      }
    }
    throw error
  }
}

export async function findById(id: string): Promise<Member | null> {
  const [result] = await db.select().from(members).where(eq(members.id, id))
  return result
}
