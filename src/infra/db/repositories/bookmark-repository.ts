import { and, eq, sql } from 'drizzle-orm'
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

export async function findBookmarks(
  workspaceId: string,
  embedded: number[]
): Promise<Bookmark[] | DomainError> {
  const bookmarks = await db
    .select()
    .from(schema.bookmarks)
    .where(
      and(
        eq(schema.bookmarks.workspaceId, workspaceId),
        sql`embedding <-> ${embedded} < 0.5`
      )
    )

  return bookmarks
}
