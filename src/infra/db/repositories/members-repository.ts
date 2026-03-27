import { eq } from 'drizzle-orm'
import type { InsertMember, Member } from '@/domain/entities/member'
import { CannotCreateDuplicatedMember } from '@/domain/errors/cannot-create-duplicated-member'
import type { DomainError } from '@/domain/errors/domain-error'
import { db } from '@/infra/db/'
import { members } from '@/infra/db/schema'
import { handleInsertError } from '@/infra/db/utils/insert-with-error-handling'
import type { Transaction } from '@/infra/db/utils/transactions'
import { withSpan } from '@/infra/utils/with-span'

export async function insertMember(
  member: InsertMember
): Promise<Member | DomainError> {
  return withSpan('insert-member', () =>
    handleInsertError(
      () => db.insert(members).values(member).returning(),
      CannotCreateDuplicatedMember,
      'Failed to insert member'
    )
  )
}

export async function insertMemberWithTransaction(
  tx: Transaction,
  member: InsertMember
): Promise<Member | DomainError> {
  return withSpan('insert-member-with-transaction', () =>
    handleInsertError(
      () => tx.insert(members).values(member).returning(),
      CannotCreateDuplicatedMember,
      'Failed to insert member'
    )
  )
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
