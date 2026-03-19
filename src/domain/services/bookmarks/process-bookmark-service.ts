import { trace } from '@opentelemetry/api'
import { DomainError } from '@/domain/errors/domain-error'
import {
  findBookmarkById,
  updateBookmark,
} from '@/infra/db/repositories/bookmark-repository'
import type { EmbeddingService } from '@/infra/ports/embedding'
import type { ScrappingService } from '@/infra/ports/scrapping'
import type { SummarizeService } from '@/infra/ports/summarize'

export async function processBookmark(
  bookmarkId: string,
  scrappingService: ScrappingService,
  embeddingService: EmbeddingService,
  summarizeService: SummarizeService
): Promise<void> {
  const tracer = trace.getTracer('process-bookmark')

  return tracer.startActiveSpan('process-bookmark-service', async span => {
    const bookmark = await findBookmarkById(bookmarkId)
    if (!bookmark) {
      span.end()
      return
    }

    await updateBookmark(bookmarkId, { status: 'processing' })

    const rawText = await scrappingService.scrapping(bookmark.url, tracer)
    if (rawText instanceof DomainError) {
      await updateBookmark(bookmarkId, {
        status: 'failed',
        failureReason: rawText.message,
      })
      span.end()
      return
    }

    const description = await summarizeService.summarize(rawText, tracer)
    if (description instanceof DomainError) {
      await updateBookmark(bookmarkId, {
        status: 'failed',
        failureReason: description.message,
      })
      span.end()
      return
    }

    const titleResult = await summarizeService.generateTitle(description, tracer)
    const title = titleResult instanceof DomainError ? undefined : titleResult

    const tagsResult = await summarizeService.generateTags(description, tracer)
    const tags = tagsResult instanceof DomainError ? null : tagsResult

    const embedding = await embeddingService.generateEmbedding(description, tracer)
    if (embedding instanceof DomainError) {
      await updateBookmark(bookmarkId, {
        status: 'failed',
        failureReason: embedding.message,
      })
      span.end()
      return
    }

    await updateBookmark(bookmarkId, {
      status: 'ready',
      description,
      title,
      tags,
      embedding,
    })

    span.end()
  })
}
