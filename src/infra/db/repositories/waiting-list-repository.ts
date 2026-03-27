import type {
  InsertWaitingListEntry,
  WaitingListEntry,
} from '@/domain/entities/waiting-list'
import type { DomainError } from '@/domain/errors/domain-error'
import { EmailAlreadyOnWaitingList } from '@/domain/errors/email-already-on-waiting-list'
import { withSpan } from '@/infra/utils/with-span'
import { db } from '..'
import { schema } from '../schema'
import { handleInsertError } from '../utils/insert-with-error-handling'

export async function insertWaitingListEntry(
  entry: InsertWaitingListEntry
): Promise<WaitingListEntry | DomainError> {
  return withSpan('insert-waiting-list-entry', () =>
    handleInsertError(
      () => db.insert(schema.waitingList).values(entry).returning(),
      EmailAlreadyOnWaitingList,
      'Failed to insert waiting list entry'
    )
  )
}
