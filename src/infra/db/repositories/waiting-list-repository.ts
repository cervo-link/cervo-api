import type { InsertWaitingListEntry, WaitingListEntry } from '@/domain/entities/waiting-list'
import { DomainError } from '@/domain/errors/domain-error'
import { EmailAlreadyOnWaitingList } from '@/domain/errors/email-already-on-waiting-list'
import { withSpan } from '@/infra/utils/with-span'
import { db } from '..'
import { schema } from '../schema'
import { getPgError } from '../utils/get-pg-error'
import { PgIntegrityConstraintViolation } from '../utils/postgres-error-codes'

export async function insertWaitingListEntry(
  entry: InsertWaitingListEntry
): Promise<WaitingListEntry | DomainError> {
  return withSpan('insert-waiting-list-entry', async () => {
    try {
      const [result] = await db
        .insert(schema.waitingList)
        .values(entry)
        .returning()

      return result
    } catch (error) {
      const pgError = getPgError(error)
      if (pgError?.code === PgIntegrityConstraintViolation.UniqueViolation) {
        return new EmailAlreadyOnWaitingList()
      }
      return new DomainError(
        `Failed to insert waiting list entry: ${error as string}`,
        500
      )
    }
  })
}
