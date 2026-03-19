import { trace } from '@opentelemetry/api'
import { BookmarkNotFound } from '@/domain/errors/bookmark-not-found'
import { BookmarkNotInFailedState } from '@/domain/errors/bookmark-not-in-failed-state'
import type { DomainError } from '@/domain/errors/domain-error'
import {
  findBookmarkById,
  updateBookmark,
} from '@/infra/db/repositories/bookmark-repository'
import type { EmbeddingService } from '@/infra/ports/embedding'
import type { ScrappingService } from '@/infra/ports/scrapping'
import type { SummarizeService } from '@/infra/ports/summarize'
import { processBookmark } from './process-bookmark-service'

export async function retryBookmark(
  bookmarkId: string,
  scrappingService: ScrappingService,
  embeddingService: EmbeddingService,
  summarizeService: SummarizeService
): Promise<DomainError | null> {
  const tracer = trace.getTracer('retry-bookmark')

  return tracer.startActiveSpan('retry-bookmark-service', async span => {
    const bookmark = await findBookmarkById(bookmarkId)
    if (!bookmark) {
      span.end()
      return new BookmarkNotFound()
    }

    if (bookmark.status !== 'failed') {
      span.end()
      return new BookmarkNotInFailedState()
    }

    await updateBookmark(bookmarkId, { status: 'submitted', failureReason: null })

    setImmediate(() => {
      processBookmark(bookmarkId, scrappingService, embeddingService, summarizeService)
    })

    span.end()
    return null
  })
}
