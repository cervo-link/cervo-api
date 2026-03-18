import { trace } from '@opentelemetry/api'
import { and, asc, eq, getTableColumns, sql } from 'drizzle-orm'
import type { Bookmark, InsertBookmark } from '@/domain/entities/bookmark'
import type { DomainError } from '@/domain/errors/domain-error'
import { FailedToCreateBookmark } from '@/domain/errors/failed-to-create-bookmark'
import { db } from '..'
import { schema } from '../schema'
import { getPgError } from '../utils/get-pg-error'

export async function insertBookmark(
  params: InsertBookmark
): Promise<Bookmark | DomainError> {
  const tracer = trace.getTracer('insert-bookmark')

  return tracer.startActiveSpan('insert-bookmark-repository', async span => {
    try {
      const [result] = await db
        .insert(schema.bookmarks)
        .values(params)
        .returning()

      span.end()
      return result
    } catch (error) {
      const pgError = getPgError(error)

      span.end()
      return new FailedToCreateBookmark(pgError?.message)
    }
  })
}

export async function findBookmarks(
  workspaceId: string,
  embedded: number[],
  limit: number
): Promise<Omit<Bookmark, 'embedding'>[]> {
  const tracer = trace.getTracer('get-bookmarks')

  return tracer.startActiveSpan('find-bookmarks-repository', async span => {
    const { embedding: _embedding, ...columns } = getTableColumns(
      schema.bookmarks
    )

    const bookmarks = await db
      .select(columns)
      .from(schema.bookmarks)
      .where(
        and(
          eq(schema.bookmarks.workspaceId, workspaceId),
          eq(schema.bookmarks.visible, true)
        )
      )
      .orderBy(asc(sql`embedding <-> ${JSON.stringify(embedded)}::vector`))
      .limit(limit)

span.end()
    return bookmarks
  })
}
