import { DomainError } from '@/domain/errors/domain-error'
import {
  findBookmarkById,
  updateBookmark,
} from '@/infra/db/repositories/bookmark-repository'
import type { EmbeddingService } from '@/infra/ports/embedding'
import type { ScrappingService } from '@/infra/ports/scrapping'
import type { SummarizeService } from '@/infra/ports/summarize'
import { withSpan } from '@/infra/utils/with-span'

export async function processBookmark(
  bookmarkId: string,
  scrappingService: ScrappingService,
  embeddingService: EmbeddingService,
  summarizeService: SummarizeService
): Promise<void> {
  return withSpan('process-bookmark', async (_span, tracer) => {
    const bookmark = await findBookmarkById(bookmarkId)
    if (!bookmark) {
      return
    }

    await updateBookmark(bookmarkId, { status: 'processing' })

    const rawText = await scrappingService.scrapping(bookmark.url, tracer)
    if (rawText instanceof DomainError) {
      await updateBookmark(bookmarkId, {
        status: 'failed',
        failureReason: rawText.message,
      })
      return
    }

    const description = await summarizeService.summarize(rawText, tracer)
    if (description instanceof DomainError) {
      await updateBookmark(bookmarkId, {
        status: 'failed',
        failureReason: description.message,
      })
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
      return
    }

    await updateBookmark(bookmarkId, {
      status: 'ready',
      description,
      title,
      tags,
      embedding,
    })
  })
}
