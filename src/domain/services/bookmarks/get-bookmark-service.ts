import { trace } from '@opentelemetry/api'
import type { Bookmark } from '@/domain/entities/bookmark'
import { DomainError } from '@/domain/errors/domain-error'
import { findBookmarks } from '@/infra/db/repositories/bookmark-repository'
import type { EmbeddingService } from '@/infra/ports/embedding'

export type GetBookmarksInput = {
  workspaceId: string
  memberId: string
  text: string
}

export async function getBookmarks(
  input: GetBookmarksInput,
  embeddingService: EmbeddingService
): Promise<Bookmark[] | DomainError> {
  const tracer = trace.getTracer('get-bookmarks-service')

  return tracer.startActiveSpan('get-bookmarks-service', async span => {
    const embedded = await embeddingService.generateEmbedding(
      input.text,
      tracer
    )
    if (embedded instanceof DomainError) {
      span.end()
      return embedded
    }

    const bookmarks = await findBookmarks(input.workspaceId, embedded)

    if (bookmarks instanceof DomainError) {
      span.end()
      return bookmarks
    }

    span.end()
    return bookmarks
  })
}
