import { and, asc, eq, getTableColumns, inArray, lt, sql } from 'drizzle-orm'
import type { Bookmark, InsertBookmark } from '@/domain/entities/bookmark'
import type { DomainError } from '@/domain/errors/domain-error'
import { FailedToCreateBookmark } from '@/domain/errors/failed-to-create-bookmark'
import { withSpan } from '@/infra/utils/with-span'
import { db } from '..'
import { schema } from '../schema'
import { getPgError } from '../utils/get-pg-error'

type BookmarkUpdates = Partial<
  Pick<Bookmark, 'status' | 'title' | 'description' | 'tags' | 'embedding' | 'failureReason'>
>

export async function insertBookmark(
  params: InsertBookmark
): Promise<Bookmark | DomainError> {
  return withSpan('insert-bookmark', async () => {
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
  })
}

export async function findBookmarkById(id: string): Promise<Bookmark | null> {
  return withSpan('find-bookmark-by-id', async () => {
    const [result] = await db
      .select()
      .from(schema.bookmarks)
      .where(eq(schema.bookmarks.id, id))
    return result || null
  })
}

export async function updateBookmark(
  id: string,
  updates: BookmarkUpdates
): Promise<void> {
  return withSpan('update-bookmark', async () => {
    await db
      .update(schema.bookmarks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.bookmarks.id, id))
  })
}

export async function deleteBookmark(id: string): Promise<boolean> {
  return withSpan('delete-bookmark', async () => {
    const result = await db
      .delete(schema.bookmarks)
      .where(eq(schema.bookmarks.id, id))
      .returning({ id: schema.bookmarks.id })
    return result.length > 0
  })
}

export async function findBookmarks(
  workspaceId: string,
  embedded: number[],
  limit: number
): Promise<Omit<Bookmark, 'embedding'>[]> {
  return withSpan('get-bookmarks', async () => {
    const { embedding: _embedding, ...columns } = getTableColumns(
      schema.bookmarks
    )

    const distance = sql<number>`embedding <=> ${JSON.stringify(embedded)}::vector`

    return db
      .select(columns)
      .from(schema.bookmarks)
      .where(
        and(
          eq(schema.bookmarks.workspaceId, workspaceId),
          eq(schema.bookmarks.visible, true),
          lt(distance, 0.7)
        )
      )
      .orderBy(asc(distance))
      .limit(limit)
  })
}

export async function findBookmarksAcrossWorkspaces(
  workspaceIds: string[],
  embedded: number[],
  limit: number
): Promise<Omit<Bookmark, 'embedding'>[]> {
  return withSpan('get-bookmarks-across-workspaces', async () => {
    const { embedding: _embedding, ...columns } = getTableColumns(
      schema.bookmarks
    )

    const distance = sql<number>`embedding <=> ${JSON.stringify(embedded)}::vector`

    return db
      .select(columns)
      .from(schema.bookmarks)
      .where(
        and(
          inArray(schema.bookmarks.workspaceId, workspaceIds),
          eq(schema.bookmarks.visible, true),
          lt(distance, 0.7)
        )
      )
      .orderBy(asc(distance))
      .limit(limit)
  })
}
