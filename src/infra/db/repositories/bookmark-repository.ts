import type { Bookmark, InsertBookmark } from '@/domain/entities/bookmark'
import type { DomainError } from '@/domain/errors/domain-error'
import { FailedToCreateBookmark } from '@/domain/errors/failed-to-create-bookmark'
import { db } from '..'
import { schema } from '../schema'
import { getPgError } from '../utils/get-pg-error'

export async function insertBookmark(
  params: InsertBookmark
): Promise<Bookmark | DomainError> {
  try {
    const [result] = await db
      .insert(schema.bookmarks)
      .values(params)
      .returning()

    return result
  } catch (error) {
    const pgError = getPgError(error)

    return new FailedToCreateBookmark(pgError?.message)
  }
}
